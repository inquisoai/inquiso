import { describe, expect, it } from 'vitest'
import { gateCandidate } from '@/core/memory/pipeline/gate'
import type { MemoryCandidate } from '@/shared/memory/candidate'

const base: MemoryCandidate = {
  proposedKind: 'site_knowledge',
  summary: 'Billing is under Account.',
  structuredContent: {},
  scope: { level: 'site', origin: 'https://portal.test' },
  provenance: { source: 'successful_episode', eventIds: ['evt_1'], runIds: ['run_1'] },
  confidence: 0.8,
  sensitivity: 'internal',
  websiteSupplied: false,
  expectedValue: 'site_navigation',
  recommendedDecision: 'store',
}

describe('deterministic write gate', () => {
  it('stores verified episode knowledge', () => {
    expect(gateCandidate(base).decision).toBe('store')
  })

  it('discards secrets regardless of source or recommendation', () => {
    const c = {
      ...base,
      summary: 'The password is hunter2',
      provenance: { ...base.provenance, source: 'explicit_user' as const },
    }
    expect(gateCandidate(c).decision).toBe('discard')
  })

  it('discards authentication/financial sensitivity outright', () => {
    expect(gateCandidate({ ...base, sensitivity: 'authentication' }).decision).toBe('discard')
    expect(gateCandidate({ ...base, sensitivity: 'financial' }).decision).toBe('discard')
  })

  it('quarantines website-supplied content even when marked store', () => {
    const c = { ...base, websiteSupplied: true, recommendedDecision: 'store' as const }
    const r = gateCandidate(c)
    expect(r.decision).toBe('quarantine')
  })

  it('lets explicit user requests through (unless unsafe)', () => {
    const c = { ...base, provenance: { ...base.provenance, source: 'explicit_user' as const } }
    expect(gateCandidate(c).decision).toBe('store')
  })

  it('discards low-confidence inferences', () => {
    expect(gateCandidate({ ...base, confidence: 0.2 }).decision).toBe('discard')
  })

  it('asks the user before storing an inferred preference', () => {
    const c = { ...base, proposedKind: 'preference' as const }
    expect(gateCandidate(c).decision).toBe('ask_user')
  })

  it('never lets an unrecognized source self-store via recommendation', () => {
    const c = {
      ...base,
      provenance: { ...base.provenance, source: 'consolidation' as const },
      recommendedDecision: 'store' as const,
    }
    expect(gateCandidate(c).decision).toBe('ask_user')
  })
})
