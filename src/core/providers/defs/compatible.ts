import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { CustomProvider } from '@/shared/custom-provider'
import type { ProviderDef } from '../types'

interface CompatibleSpec {
  id: string
  label: string
  baseURL: string
  defaultModel: string
  dataUse: string
  keyUrl?: string
  requiresKey?: boolean
  custom?: boolean
}

/** Builds a ProviderDef for any OpenAI-compatible endpoint (gateway, custom,
 * or local). One code path serves them all — the baseURL is the only thing
 * that differs. Model ids are free-text (the endpoint validates them). */
export function compatibleDef(spec: CompatibleSpec): ProviderDef {
  return {
    id: spec.id,
    label: spec.label,
    kind: 'compatible',
    requiresKey: spec.requiresKey ?? true,
    defaultModel: spec.defaultModel,
    models: [],
    toolCalls: true,
    files: true,
    reasoning: false,
    search: false,
    dataUse: spec.dataUse,
    baseURL: spec.baseURL,
    ...(spec.keyUrl ? { keyUrl: spec.keyUrl } : {}),
    ...(spec.custom ? { custom: true } : {}),
    makeModel: (apiKey, modelId) =>
      createOpenAICompatible({ name: spec.id, baseURL: spec.baseURL, apiKey })(modelId),
  }
}

/** ProviderDef for a stored user-defined provider. */
export const customDef = (p: CustomProvider): ProviderDef =>
  compatibleDef({
    id: p.id,
    label: p.label,
    baseURL: p.baseURL,
    defaultModel: p.model,
    requiresKey: p.requiresKey,
    custom: true,
    dataUse: `Sent to ${new URL(p.baseURL).host} with your key (a provider you added).`,
  })
