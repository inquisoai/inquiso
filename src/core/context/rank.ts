import type { PageContext } from '@/shared/page'

/** Extracts meaningful query terms (drops short/stop-ish tokens). */
function terms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2)
}

/** Lexical relevance: how many distinct query terms appear in the page. A
 * cheap first pass; on-device embedding retrieval is a future enhancement. */
function score(page: PageContext, ts: string[]): number {
  const hay = `${page.title}\n${page.text}`.toLowerCase()
  return ts.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0)
}

/** Orders pages by relevance to the query (stable for an empty query). */
export function rankPages(pages: PageContext[], query: string): PageContext[] {
  const ts = terms(query)
  if (ts.length === 0) return pages
  return [...pages].sort((a, b) => score(b, ts) - score(a, ts))
}
