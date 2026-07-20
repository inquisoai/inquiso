import { beforeEach, describe, expect, it, vi } from 'vitest'
import { admitCandidate } from '@/core/memory/pipeline/admit'
import { feedbackMisleading, feedbackUseful } from '@/core/memory/store/feedback'
import { clearMemories, getMemory } from '@/core/memory/store/records'

vi.mock('localforage', async () => (await import('../../helpers/memdb')).localforageMock())

const seed = async () => {
  const r = await admitCandidate({
    proposedKind: 'site_knowledge',
    summary: 'Billing is under the Account menu.',
    structuredContent: {},
    scope: { level: 'site', origin: 'https://portal.test' },
    provenance: { source: 'successful_episode', eventIds: [], runIds: [] },
    confidence: 0.8,
    sensitivity: 'internal',
    websiteSupplied: false,
    expectedValue: 'site_navigation',
    recommendedDecision: 'store',
  })
  return r.record?.id ?? ''
}

describe('model memory feedback (narrow write surface)', () => {
  beforeEach(() => clearMemories())

  it('bumps counters only — trust, status, and confidence stay untouched', async () => {
    const id = await seed()
    expect(await feedbackUseful(id)).toBe(true)
    expect(await feedbackMisleading(id)).toBe(true)
    const m = await getMemory(id)
    expect(m?.metrics.usefulCount).toBe(1)
    expect(m?.metrics.misleadingCount).toBe(1)
    expect(m?.trust.confidence).toBe(0.8)
    expect(m?.trust.userConfirmed).toBe(false)
    expect(m?.status).toBe('active')
  })

  it('reports false for unknown memories', async () => {
    expect(await feedbackUseful('mem_nope')).toBe(false)
  })
})
