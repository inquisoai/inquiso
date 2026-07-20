import type { MemoryKind, MemoryStatus, ScopeLevel } from '@/shared/memory/enums'
import { isCurrent, type MemoryRecord } from '@/shared/memory/record'
import { allMemories } from './records'

export interface MemoryFilter {
  kind?: MemoryKind
  status?: MemoryStatus
  level?: ScopeLevel
  origin?: string
  /** Only memories live right now (active + inside temporal validity). */
  currentOnly?: boolean
}

const originMatches = (m: MemoryRecord, origin: string): boolean =>
  m.scope.origin === origin || m.scope.origin === undefined

/** Hard filters — applied before any ranking, so out-of-scope memories can
 * never leak into a bundle regardless of similarity (docs/memory-agent). */
export function applyFilter(
  all: MemoryRecord[],
  f: MemoryFilter,
  now = Date.now(),
): MemoryRecord[] {
  return all.filter((m) => {
    if (f.kind && m.kind !== f.kind) return false
    if (f.status && m.status !== f.status) return false
    if (f.level && m.scope.level !== f.level) return false
    if (f.origin !== undefined && !originMatches(m, f.origin)) return false
    if (f.currentOnly && !isCurrent(m, now)) return false
    return true
  })
}

export async function listMemories(f: MemoryFilter = {}): Promise<MemoryRecord[]> {
  return applyFilter(await allMemories(), f)
}

const tokens = (s: string): string[] =>
  s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 2)

/** Lexical score: distinct query-term hits over the searchable text. */
export function lexicalScore(m: MemoryRecord, query: string): number {
  const text = m.searchableText.toLowerCase()
  const terms = new Set(tokens(query))
  let hits = 0
  for (const t of terms) if (text.includes(t)) hits += 1
  return terms.size === 0 ? 0 : hits / terms.size
}

/** Jaccard similarity between two searchable texts (dedupe signal). */
export function textSimilarity(a: string, b: string): number {
  const ta = new Set(tokens(a))
  const tb = new Set(tokens(b))
  if (ta.size === 0 || tb.size === 0) return 0
  let both = 0
  for (const t of ta) if (tb.has(t)) both += 1
  return both / (ta.size + tb.size - both)
}
