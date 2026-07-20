import { describe, expect, it } from 'vitest'
import { scoreMemory } from '@/core/memory/retrieval/score'

describe('hybrid scoring', () => {
  const base = {
    id: 'mem_x',
    kind: 'fact' as const,
    scope: { level: 'user' as const },
    content: {},
    summary: 'The user prefers PDF exports.',
    searchableText: 'the user prefers pdf exports',
    provenance: { source: 'explicit_user' as const, eventIds: [], runIds: [] },
    trust: {
      confidence: 0.9,
      sensitivity: 'personal' as const,
      userConfirmed: false,
      websiteSupplied: false,
    },
    temporal: { createdAt: 0, updatedAt: 0, observedAt: Date.now() },
    relations: { derivedFromIds: [], relatedIds: [] },
    metrics: { retrievalCount: 0, usefulCount: 0, misleadingCount: 0 },
    status: 'active' as const,
  }

  it('user confirmation and usefulness raise the score; misleading history lowers it', () => {
    const now = Date.now()
    const plain = scoreMemory(base, 'pdf export', now)
    const confirmed = scoreMemory(
      { ...base, trust: { ...base.trust, userConfirmed: true } },
      'pdf export',
      now,
    )
    const misled = scoreMemory(
      { ...base, metrics: { ...base.metrics, misleadingCount: 2 } },
      'pdf export',
      now,
    )
    expect(confirmed).toBeGreaterThan(plain)
    expect(misled).toBeLessThan(plain)
  })
})
