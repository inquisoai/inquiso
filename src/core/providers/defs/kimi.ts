import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { ProviderDef } from '../types'

/** Moonshot AI (Kimi), international endpoint. OpenAI-compatible mode serves
 * chat, tool-calling, and vision (kimi-latest) from one host with one key. */
const BASE_URL = 'https://api.moonshot.ai/v1'

const client = (apiKey: string) =>
  createOpenAICompatible({ name: 'kimi', baseURL: BASE_URL, apiKey })

export const kimi: ProviderDef = {
  id: 'kimi',
  label: 'Kimi (Moonshot AI)',
  kind: 'cloud',
  requiresKey: true,
  defaultModel: 'kimi-latest',
  models: ['kimi-latest', 'kimi-k2-0905-preview', 'kimi-k2-turbo-preview', 'moonshot-v1-128k'],
  toolCalls: true,
  files: true,
  reasoning: false,
  search: false,
  dataUse: 'Sent to api.moonshot.ai (Moonshot AI) with your Kimi API key.',
  keyUrl: 'https://platform.moonshot.ai/console/api-keys',
  baseURL: BASE_URL,
  makeModel: (apiKey, modelId) => client(apiKey)(modelId),
}
