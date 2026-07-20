import { getCached } from '@/core/data/cache/page-cache'
import type { Scope } from '@/shared/constants'
import type { PageContext } from '@/shared/page'
import { extractTab } from './extract-active'
import { resolveScopeTabs } from './scope'

/** Removes pages with duplicate content (same hash) — e.g. the same article
 * open in two tabs — keeping the first. */
function dedupe(pages: PageContext[]): PageContext[] {
  const seen = new Set<string>()
  return pages.filter((p) => (seen.has(p.contentHash) ? false : seen.add(p.contentHash) && true))
}

/**
 * Extracts readable content for every tab in scope (cached + coalesced), then
 * de-duplicates. Extraction failures (restricted tabs, etc.) are skipped.
 */
export async function getScopedContext(scope: Scope): Promise<PageContext[]> {
  const tabs = await resolveScopeTabs(scope)
  const settled = await Promise.allSettled(
    tabs.map((t) => getCached(t.url ?? String(t.id), () => extractTab(t.id ?? -1))),
  )
  const pages = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
  return dedupe(pages)
}
