import { rankPages } from '@/core/context/rank'
import type { PageContext } from '@/shared/page'
import { getVector, setVector } from './cache'
import { resolveEmbedder } from './cloud'
import { cosineSimilarity } from './cosine'
import type { Embedder } from './types'

const MAX_EMBED_CHARS = 8000

/** Returns a vector per page, embedding (and caching) only the cache misses. */
async function vectorsFor(pages: PageContext[], embedder: Embedder): Promise<(number[] | null)[]> {
  const keys = pages.map((p) => `${embedder.id}:${p.contentHash}`)
  const vectors = await Promise.all(keys.map(getVector))
  const misses = pages.map((p, i) => ({ p, i })).filter(({ i }) => !vectors[i])
  if (misses.length > 0) {
    const fresh = await embedder.embed(misses.map((m) => m.p.text.slice(0, MAX_EMBED_CHARS)))
    await Promise.all(
      misses.map((m, j) => {
        const v = fresh[j] ?? []
        vectors[m.i] = v
        return setVector(keys[m.i] ?? '', v)
      }),
    )
  }
  return vectors
}

/**
 * Orders pages by semantic relevance to the query (cached embeddings + cosine),
 * falling back to lexical ranking when no embedder/key is available or on error.
 */
export async function orderPages(pages: PageContext[], query: string): Promise<PageContext[]> {
  if (pages.length <= 1 || !query.trim()) return pages
  const embedder = await resolveEmbedder()
  if (!embedder) return rankPages(pages, query)

  try {
    const [queryVec] = await embedder.embed([query])
    if (!queryVec) return rankPages(pages, query)
    const vectors = await vectorsFor(pages, embedder)
    return pages
      .map((p, i) => {
        const v = vectors[i]
        return { p, score: v ? cosineSimilarity(queryVec, v) : -1 }
      })
      .sort((a, b) => b.score - a.score)
      .map((scored) => scored.p)
  } catch {
    return rankPages(pages, query)
  }
}
