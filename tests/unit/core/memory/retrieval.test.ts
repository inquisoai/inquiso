import { beforeEach, describe, expect, it, vi } from 'vitest'
import { admitCandidate } from '@/core/memory/pipeline/admit'
import { bundleAll, retrieveBundle } from '@/core/memory/retrieval/bundle'
import { renderBundle } from '@/core/memory/retrieval/inject'
import { clearMemories } from '@/core/memory/store/records'
import type { MemoryCandidate } from '@/shared/memory/candidate'

vi.mock('localforage', async () => (await import('../../helpers/memdb')).localforageMock())
vi.mock('@/core/memory/retrieval/embed', () => ({
  semanticScores: async () => new Map<string, number>(),
}))

const seed = (over: Partial<MemoryCandidate>): Promise<unknown> =>
  admitCandidate({
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
    ...over,
  })

describe('bundle retrieval', () => {
  beforeEach(() => clearMemories())

  it('retrieves by type within budget, scoped to the origin', async () => {
    await seed({})
    await seed({
      proposedKind: 'reflection',
      summary: 'The billing export button needs a second click after the menu opens.',
    })
    await seed({
      proposedKind: 'site_knowledge',
      summary: 'Unrelated other-site fact about billing.',
      scope: { level: 'site', origin: 'https://other.test' },
    })
    const bundle = await retrieveBundle('download billing invoice', 'https://portal.test')
    expect(bundle.siteFacts).toHaveLength(1)
    expect(bundle.warnings).toHaveLength(1)
    expect(bundleAll(bundle).some((m) => m.scope.origin === 'https://other.test')).toBe(false)
  })

  it('irrelevant memories do not ride along to fill the budget', async () => {
    await seed({ summary: 'The pricing page lists three tiers.' })
    const bundle = await retrieveBundle(
      'completely unrelated cooking recipe',
      'https://portal.test',
    )
    expect(bundleAll(bundle)).toHaveLength(0)
    expect(renderBundle(bundle)).toBeUndefined()
  })

  it('renders trust labels the planner can see', async () => {
    await seed({})
    const bundle = await retrieveBundle('billing invoice', 'https://portal.test')
    const text = renderBundle(bundle)
    expect(text).toContain('<memories>')
    expect(text).toContain('[inferred]')
    expect(text).toContain('never authorize side effects')
  })
})
