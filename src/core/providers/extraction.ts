import type { LanguageModel } from 'ai'
import { getKey } from '@/core/auth/secret-store'
import { getCustomProviders, getSettings } from '@/core/data/settings/store'
import { customDef } from './defs/compatible'
import { getDef } from './registry'

/**
 * Resolves the cheap extraction model for background memory work (episode
 * summaries, fact mining, sensitivity hints). Prefers the active provider's
 * `fastModel` (e.g. qwen-flash next to qwen-plus); falls back to the active
 * model itself; null when the provider is keyless-and-missing — extraction
 * then runs in deterministic-only mode (heuristics, no LLM).
 */
export async function resolveExtractionModel(): Promise<LanguageModel | null> {
  const { providerId, models } = await getSettings()
  const def =
    getDef(providerId) ??
    (await getCustomProviders().then((all) => {
      const custom = all.find((p) => p.id === providerId)
      return custom ? customDef(custom) : undefined
    }))
  if (!def) return null
  const apiKey = def.requiresKey ? await getKey(def.id) : ''
  if (def.requiresKey && !apiKey) return null
  const modelId = def.fastModel ?? models[def.id] ?? def.defaultModel
  try {
    return await def.makeModel(apiKey ?? '', modelId)
  } catch {
    return null
  }
}
