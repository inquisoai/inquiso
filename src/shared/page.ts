import { z } from 'zod'

/**
 * Extracted, model-ready representation of a web page. Shared by the content
 * extractor, the cache, and the background — lives in `shared` so no boundary
 * is crossed (docs/07-project-structure.md).
 */
export const PageContext = z.object({
  url: z.string().url(),
  title: z.string(),
  /** Clean Markdown of the readable article body. */
  text: z.string(),
  excerpt: z.string().optional(),
  byline: z.string().optional(),
  siteName: z.string().optional(),
  lengthChars: z.number(),
  /** FNV-1a hash of `text`, used as the cache key suffix. */
  contentHash: z.string(),
  extractedAt: z.number(),
})

export type PageContext = z.infer<typeof PageContext>

/** Lightweight tab identity for the "what am I sharing?" preview (no content
 * — just what the user can already see in their tab strip). */
export interface TabInfo {
  title: string
  url: string
}
