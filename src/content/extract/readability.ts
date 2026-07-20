import { Readability } from '@mozilla/readability'
import type { PageContext } from '@/shared/page'
import { hashString } from '@/shared/util/hash'
import { htmlToMarkdown } from './to-markdown'

const MAX_CHARS = 100_000

/**
 * Extracts the readable article from a document and returns a model-ready
 * PageContext. Readability runs on a CLONE so the live page is never mutated.
 */
export function extractPage(doc: Document): PageContext {
  const clone = doc.cloneNode(true) as Document
  const article = new Readability(clone).parse()
  const html = article?.content ?? doc.body?.innerHTML ?? ''
  const markdown = htmlToMarkdown(html)
  const text = (markdown || doc.body?.innerText || '').slice(0, MAX_CHARS)

  return {
    url: location.href,
    title: article?.title || doc.title,
    text,
    excerpt: article?.excerpt ?? undefined,
    byline: article?.byline ?? undefined,
    siteName: article?.siteName ?? undefined,
    lengthChars: text.length,
    contentHash: hashString(text),
    extractedAt: Date.now(),
  }
}
