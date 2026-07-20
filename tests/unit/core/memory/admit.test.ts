import { beforeEach, describe, expect, it, vi } from 'vitest'
import { admitCandidate } from '@/core/memory/pipeline/admit'
import { listBlocked } from '@/core/memory/pipeline/blocked'
import { allMemories, clearMemories, getMemory } from '@/core/memory/store/records'
import type { MemoryCandidate } from '@/shared/memory/candidate'

vi.mock('localforage', async () => (await import('../../helpers/memdb')).localforageMock())

const candidate = (over: Partial<MemoryCandidate> = {}): MemoryCandidate => ({
  proposedKind: 'site_knowledge',
  summary: 'Billing lives under the Settings menu.',
  structuredContent: {},
  scope: { level: 'site', origin: 'https://portal.test' },
  provenance: { source: 'successful_episode', eventIds: [], runIds: [] },
  confidence: 0.8,
  sensitivity: 'internal',
  websiteSupplied: false,
  expectedValue: 'site_navigation',
  recommendedDecision: 'store',
  ...over,
})

describe('memory write pipeline', () => {
  beforeEach(() => clearMemories())

  it('stores a fresh verified candidate as active', async () => {
    const r = await admitCandidate(candidate())
    expect(r.decision).toBe('stored')
    expect(r.record?.status).toBe('active')
  })

  it('reinforces a duplicate instead of duplicating it', async () => {
    const first = await admitCandidate(candidate())
    const again = await admitCandidate(candidate({ confidence: 0.7 }))
    expect(again.decision).toBe('reinforced')
    expect(again.record?.id).toBe(first.record?.id)
    expect((await allMemories()).filter((m) => m.status === 'active')).toHaveLength(1)
    const stored = await getMemory(first.record?.id ?? '')
    expect(stored?.trust.confidence).toBeGreaterThan(0.8)
  })

  it('supersedes a conflicting slot: old preserved, closed, and linked', async () => {
    const oldFact = await admitCandidate(candidate({ slotKey: 'billing-location' }))
    const newFact = await admitCandidate(
      candidate({
        summary: 'Billing has moved: it is now under the Account menu.',
        slotKey: 'billing-location',
      }),
    )
    expect(newFact.decision).toBe('superseded')
    const old = await getMemory(oldFact.record?.id ?? '')
    expect(old?.status).toBe('superseded')
    expect(old?.temporal.validUntil).toBeDefined()
    expect(old?.relations.contradictedById).toBe(newFact.record?.id)
    expect(newFact.record?.relations.supersedesId).toBe(oldFact.record?.id)
  })

  it('quarantines page-derived candidates and logs the attempt', async () => {
    const r = await admitCandidate(candidate({ websiteSupplied: true }))
    expect(r.decision).toBe('quarantined')
    expect(r.record?.status).toBe('quarantined')
    const blocked = await listBlocked()
    expect(blocked.some((b) => b.decision === 'quarantine')).toBe(true)
  })

  it('discards secrets and keeps only a redacted note', async () => {
    const r = await admitCandidate(
      candidate({
        summary: 'The account password is hunter2',
        provenance: { source: 'explicit_user', eventIds: [], runIds: [] },
      }),
    )
    expect(r.decision).toBe('discarded')
    expect(await allMemories()).toHaveLength(0)
    const note = (await listBlocked()).find((b) => b.decision === 'discard')
    expect(note?.summary).not.toContain('hunter2')
  })
})
