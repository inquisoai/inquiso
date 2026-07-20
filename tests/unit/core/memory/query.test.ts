import { describe, expect, it } from 'vitest'
import { applyFilter, lexicalScore, textSimilarity } from '@/core/memory/store/query'
import { MemoryRecord } from '@/shared/memory/record'

const record = (over: Record<string, unknown>): MemoryRecord =>
  MemoryRecord.parse({
    id: `mem_${Math.random().toString(36).slice(2, 8)}`,
    kind: 'fact',
    scope: { level: 'user' },
    summary: 'a fact',
    searchableText: 'a fact',
    provenance: { source: 'explicit_user' },
    trust: {
      confidence: 0.9,
      sensitivity: 'personal',
      userConfirmed: true,
      websiteSupplied: false,
    },
    temporal: { createdAt: 1, updatedAt: 1, observedAt: 1 },
    relations: {},
    metrics: {},
    status: 'active',
    ...over,
  })

describe('scope filtering (hard, pre-ranking)', () => {
  const now = 1_000_000
  const pool = [
    record({ id: 'mem_user' }),
    record({ id: 'mem_site', scope: { level: 'site', origin: 'https://a.test' } }),
    record({ id: 'mem_other', scope: { level: 'site', origin: 'https://b.test' } }),
    record({ id: 'mem_gone', status: 'superseded' }),
    record({
      id: 'mem_expired',
      temporal: { createdAt: 1, updatedAt: 1, observedAt: 1, validUntil: now - 1 },
    }),
  ]

  it('an origin filter excludes other sites but keeps user-level memories', () => {
    const ids = applyFilter(pool, { origin: 'https://a.test', currentOnly: true }, now).map(
      (m) => m.id,
    )
    expect(ids).toContain('mem_user')
    expect(ids).toContain('mem_site')
    expect(ids).not.toContain('mem_other')
  })

  it('currentOnly drops superseded and temporally-closed records', () => {
    const ids = applyFilter(pool, { currentOnly: true }, now).map((m) => m.id)
    expect(ids).not.toContain('mem_gone')
    expect(ids).not.toContain('mem_expired')
  })
})

describe('lexical ranking + similarity', () => {
  it('scores by distinct term hits', () => {
    const m = record({ searchableText: 'the user prefers pdf exports for invoices' })
    expect(lexicalScore(m, 'pdf invoice exports')).toBeGreaterThan(lexicalScore(m, 'csv uploads'))
  })

  it('near-identical texts read as duplicates', () => {
    const a = 'Billing is found under the Settings menu'
    const b = 'Billing is found under the Settings menu.'
    expect(textSimilarity(a, b)).toBeGreaterThanOrEqual(0.8)
    expect(textSimilarity(a, 'The invoice table uses virtual scrolling')).toBeLessThan(0.3)
  })
})
