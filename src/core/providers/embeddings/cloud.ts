import { embedMany } from 'ai'
import { getKey } from '@/core/auth/secret-store'
import { getSettings } from '@/core/data/settings/store'
import { getDef } from '@/core/providers/registry'
import type { Embedder } from './types'

/**
 * Resolves an embedder for the active provider (OpenAI/Google) using the
 * user's stored key. Returns null when the provider has no embedding model or
 * no key — callers then fall back to lexical ranking.
 */
export async function resolveEmbedder(): Promise<Embedder | null> {
  const { providerId } = await getSettings()
  const def = getDef(providerId)
  if (!def?.makeEmbedding || !def.embeddingModel) return null

  const apiKey = await getKey(def.id)
  if (!apiKey) return null

  const model = def.makeEmbedding(apiKey)
  return {
    id: `${def.id}:${def.embeddingModel}`,
    embed: async (texts) => (await embedMany({ model, values: texts })).embeddings,
  }
}
