import type { MemoryRecord } from '@/shared/memory/record'
import { lexicalScore } from '../store/query'

const DAY = 86_400_000

/**
 * Hybrid ranking (after hard scope filters): lexical + semantic similarity,
 * weighted by trust (confidence, user-confirmed), previous usefulness,
 * recency, and penalties for misleading history and page-supplied content.
 * Deterministic given its inputs — the weights are the observability story,
 * not a black box.
 */
export function scoreMemory(m: MemoryRecord, query: string, now: number, semantic = 0): number {
  const lexical = lexicalScore(m, query)
  const usefulness = m.metrics.usefulCount / (m.metrics.retrievalCount + 1)
  const misleading = 0.4 * m.metrics.misleadingCount
  const ageDays = Math.max(0, (now - m.temporal.observedAt) / DAY)
  const recency = Math.exp(-ageDays / 30)
  const confirmed = m.trust.userConfirmed ? 0.3 : 0
  const pagePenalty = m.trust.websiteSupplied ? 0.3 : 0
  return (
    2 * lexical +
    1.5 * semantic +
    0.5 * m.trust.confidence +
    0.5 * usefulness +
    0.3 * recency +
    confirmed -
    misleading -
    pagePenalty
  )
}

/** Minimum semantic similarity that counts as task relevance on its own. */
const SEMANTIC_FLOOR = 0.15

/**
 * Pool → best-first. With `requireRelevance` (facts/episodes/reflections), a
 * memory needs an actual lexical or semantic connection to the task — nothing
 * irrelevant rides along just to fill a budget. Preferences skip the gate:
 * "prefers PDF exports" should surface for "download the invoice" too.
 */
export function rankMemories(
  pool: MemoryRecord[],
  query: string,
  now: number,
  semantics: Map<string, number> = new Map(),
  requireRelevance = true,
): MemoryRecord[] {
  return pool
    .map((m) => {
      const semantic = semantics.get(m.id) ?? 0
      return { m, semantic, s: scoreMemory(m, query, now, semantic) }
    })
    .filter(({ m, semantic, s }) => {
      if (s <= 0) return false
      if (!requireRelevance) return true
      return lexicalScore(m, query) > 0 || semantic >= SEMANTIC_FLOOR
    })
    .sort((a, b) => b.s - a.s)
    .map(({ m }) => m)
}
