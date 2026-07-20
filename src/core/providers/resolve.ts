import type { LanguageModel, ToolSet } from 'ai'
import { requireHostPermission } from '@/core/auth/host-permissions'
import { getKey } from '@/core/auth/secret-store'
import { getCustomProviders, getSettings } from '@/core/data/settings/store'
import { getModelCatalog, modelsFor } from './catalog'
import { customDef } from './defs/compatible'
import { withDevLogging } from './dev-log'
import { type ProviderOpts, reasoningOptions } from './reasoning'
import { defaultDef, getDef } from './registry'
import type { ProviderDef, ProviderStatus } from './types'

export interface ActiveModel {
  model: LanguageModel
  /** The resolved provider id (for provider-specific run behaviour, e.g.
   * Anthropic prompt caching). */
  providerId: string
  /** Whether the model can see images (enables the vision/screenshot tool). */
  vision: boolean
  /** streamText providerOptions to enable reasoning, when on and supported. */
  providerOptions?: ProviderOpts
  /** Provider-native tools (e.g. web search) to merge into the tool set. */
  nativeTools?: ToolSet
}

/** The selected provider def — built-in, gateway, or a stored custom one.
 * Unknown/unset ids fall back to the platform default (defaultDef). */
async function activeDef(): Promise<{ def: ProviderDef; modelId: string }> {
  const { providerId, models } = await getSettings()
  let def = getDef(providerId)
  if (!def) {
    const custom = (await getCustomProviders()).find((p) => p.id === providerId)
    // Custom endpoints are reachable only while their origin grant stands —
    // verified here at request time, not just when the provider was added.
    if (custom) await requireHostPermission(custom.baseURL)
    def = custom ? customDef(custom) : defaultDef
  }
  // Match the catalog-driven default the UI shows when the user hasn't picked.
  const { defaultModel } = modelsFor(def, await getModelCatalog())
  return { def, modelId: models[def.id] ?? defaultModel }
}

/**
 * Resolves the selected provider as an AI SDK model — every provider is a
 * ProviderDef, so there are no special cases here. Throws `missing_api_key`
 * when a key-requiring provider has no stored key.
 */
export async function resolveActiveModel(): Promise<ActiveModel> {
  const { def, modelId } = await activeDef()
  const apiKey = def.requiresKey ? await getKey(def.id) : ''
  if (def.requiresKey && !apiKey) throw new Error('missing_api_key')
  const { reasoning, webSearch } = await getSettings()
  const providerOptions = def.reasoning && reasoning ? reasoningOptions(def.id) : undefined
  const nativeTools =
    def.search && webSearch && def.makeSearchTool ? def.makeSearchTool(apiKey ?? '') : undefined
  return {
    model: withDevLogging(await def.makeModel(apiKey ?? '', modelId)),
    providerId: def.id,
    vision: def.files,
    ...(providerOptions ? { providerOptions } : {}),
    ...(nativeTools ? { nativeTools } : {}),
  }
}

/** Preflight for the active provider (e.g. on-device download state). */
export async function activeAvailability(): Promise<ProviderStatus> {
  const { def } = await activeDef()
  return def.availability?.() ?? { state: 'available' }
}
