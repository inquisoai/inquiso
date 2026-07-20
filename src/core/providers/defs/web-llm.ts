import type { LanguageModel } from 'ai'
import type { ProviderDef, ProviderStatus } from '../types'

/** A handful of small, solid MLC models. Weights download once (hundreds of
 * MB–GBs) into the browser on first use; inference runs on WebGPU. */
const MODELS = [
  'Llama-3.2-3B-Instruct-q4f16_1-MLC',
  'Llama-3.2-1B-Instruct-q4f16_1-MLC',
  'Qwen2.5-3B-Instruct-q4f16_1-MLC',
  'Phi-3.5-mini-instruct-q4f16_1-MLC',
  'gemma-2-2b-it-q4f16_1-MLC',
]

// Lazily imported: the WebLLM runtime is multi-MB, so it loads as a split
// chunk only when this provider is actually used — never at startup.
const lazy = () => import('@browser-ai/web-llm')

async function availability(): Promise<ProviderStatus> {
  const { doesBrowserSupportWebLLM } = await lazy()
  return doesBrowserSupportWebLLM()
    ? { state: 'available' }
    : { state: 'unavailable', reason: 'WebLLM needs WebGPU, which this browser does not expose.' }
}

async function makeModel(_apiKey: string, modelId: string): Promise<LanguageModel> {
  const { webLLM } = await lazy()
  return webLLM(modelId)
}

/** In-browser open models via WebGPU (WebLLM) — more than one on-device model,
 * fully local and serverless, no key. First run downloads the weights. */
export const webLlm: ProviderDef = {
  id: 'web-llm',
  label: 'In-browser (WebLLM)',
  kind: 'local',
  requiresKey: false,
  defaultModel: MODELS[0] ?? '',
  models: MODELS,
  toolCalls: true,
  files: false,
  reasoning: false,
  search: false,
  dataUse:
    'Runs fully on your device via WebGPU. Weights download once from a public CDN; prompts never leave the browser.',
  availability,
  makeModel,
}
