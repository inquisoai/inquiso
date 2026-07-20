import type { PageContext } from '@/shared/page'

/** Page content containing a literal `<page`/`</page` could break out of the
 * delimiter and place attacker text outside the untrusted region — neutralize
 * the `<` so the delimiter can only ever come from us (docs/05 T1). */
const neutralize = (s: string): string => s.replace(/<(?=\/?page\b)/gi, '&lt;')

/** Wraps one untrusted page in a clearly delimited, quoted envelope. Title and
 * url are page-controlled too, so they get the same treatment. */
export function pageEnvelope(page: PageContext): string {
  const url = JSON.stringify(neutralize(page.url))
  const title = JSON.stringify(neutralize(page.title))
  return `<page url=${url} title=${title}>\n${neutralize(page.text)}\n</page>`
}

/**
 * Concatenates the given (already-ordered) pages as untrusted envelopes up to a
 * character budget, so multi-tab scopes never overflow the context window.
 * Relevance ordering happens upstream (semantic rerank → lexical fallback).
 */
export function buildContext(pages: PageContext[], maxChars: number): string {
  const parts: string[] = []
  let used = 0
  for (const page of pages) {
    if (used >= maxChars) break
    const env = pageEnvelope(page).slice(0, maxChars - used)
    parts.push(env)
    used += env.length
  }
  return parts.join('\n\n')
}
