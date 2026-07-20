import { isFirefox } from '@/platform'
import type { ProviderInfo } from '@/shared/providers'
import { anthropic } from './defs/anthropic'
import { chromeAi } from './defs/chrome-ai'
import { gatewayDefs } from './defs/gateways'
import { google } from './defs/google'
import { openai } from './defs/openai'
import { qwen } from './defs/qwen'
import { webLlm } from './defs/web-llm'
import type { ProviderDef } from './types'

/** Every built-in provider, one convention — on-device models first (Chrome AI
 * + in-browser WebLLM), then the direct clouds, then the model gateways.
 * Chromium-only providers are dropped on Firefox (no Prompt API there), so the
 * picker never offers a provider that can't run. */
export const providerDefs: ProviderDef[] = [
  chromeAi,
  webLlm,
  openai,
  anthropic,
  google,
  qwen,
  ...gatewayDefs,
].filter((d) => !(isFirefox && d.chromiumOnly))

/** The provider a fresh (or unrecognized) selection resolves to. Skips WebLLM
 * as a default: its models need more WebGPU storage buffers (10) than Firefox
 * exposes (8), so it fails there — Chrome AI on Chromium, first cloud on Firefox.
 * WebLLM stays selectable (it works on Chrome), just not the default. */
export const defaultDef: ProviderDef =
  providerDefs.find((d) => d.id !== 'web-llm') ?? providerDefs[0] ?? chromeAi

export const getDef = (id: string): ProviderDef | undefined => providerDefs.find((d) => d.id === id)

/** Strips the (non-serializable) factories for sending to the UI. */
export const toInfo = (d: ProviderDef): ProviderInfo => ({
  id: d.id,
  label: d.label,
  kind: d.kind,
  requiresKey: d.requiresKey,
  defaultModel: d.defaultModel,
  models: d.models,
  toolCalls: d.toolCalls,
  files: d.files,
  reasoning: d.reasoning,
  search: d.search,
  dataUse: d.dataUse,
  ...(d.keyUrl ? { keyUrl: d.keyUrl } : {}),
  ...(d.baseURL ? { baseURL: d.baseURL } : {}),
  ...(d.custom ? { custom: true } : {}),
})

/** All providers' serializable metadata, for the model picker and Options. */
export const providerInfos: ProviderInfo[] = providerDefs.map(toInfo)
