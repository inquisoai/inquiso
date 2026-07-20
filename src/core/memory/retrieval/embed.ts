import { getVector, setVector } from '@/core/providers/embeddings/cache'
import { resolveEmbedder } from '@/core/providers/embeddings/cloud'
import { cosineSimilarity } from '@/core/providers/embeddings/cosine'
import type { MemoryRecord } from '@/shared/memory/record'
import { hashString } from '@/shared/util/hash'

/**
 * Semantic similarity of each memory to the query when the active provider
 * has an embedding model (OpenAI, Google, Qwen text-embedding-v4); an empty
 * map otherwise — retrieval then runs lexical-only. Vectors are cached by
 * model + content hash like page embeddings (docs/06).
 */
export async function semanticScores(
  query: string,
  memories: MemoryRecord[],
): Promise<Map<string, number>> {
  if (memories.length === 0) return new Map()
  const embedder = await resolveEmbedder()
  if (!embedder) return new Map()
  try {
    const texts = [query, ...memories.map((m) => m.searchableText)]
    const keys = texts.map((t) => `${embedder.id}:${hashString(t)}`)
    const vectors = await Promise.all(keys.map(getVector))
    const missingIdx = vectors.flatMap((v, i) => (v ? [] : [i]))
    if (missingIdx.length > 0) {
      const fresh = await embedder.embed(missingIdx.map((i) => texts[i] ?? ''))
      await Promise.all(
        missingIdx.map((idx, j) => {
          const v = fresh[j]
          if (!v) return Promise.resolve()
          vectors[idx] = v
          return setVector(keys[idx] ?? '', v)
        }),
      )
    }
    const queryVec = vectors[0]
    if (!queryVec) return new Map()
    const out = new Map<string, number>()
    memories.forEach((m, i) => {
      const v = vectors[i + 1]
      if (v) out.set(m.id, cosineSimilarity(queryVec, v))
    })
    return out
  } catch {
    return new Map()
  }
}
