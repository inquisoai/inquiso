import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { ProviderDef } from '../types'

/** Alibaba Cloud Model Studio (DashScope), international endpoint. The
 * OpenAI-compatible mode serves chat, tool-calling, vision (qwen-vl), and
 * embeddings from one host with one key. */
const BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'

const client = (apiKey: string) =>
  createOpenAICompatible({ name: 'qwen', baseURL: BASE_URL, apiKey })

export const qwen: ProviderDef = {
  id: 'qwen',
  label: 'Qwen (DashScope)',
  kind: 'cloud',
  requiresKey: true,
  defaultModel: 'qwen-plus',
  models: ['qwen3-max', 'qwen-plus', 'qwen-flash', 'qwen3-vl-plus'],
  toolCalls: true,
  files: true,
  reasoning: false,
  search: false,
  dataUse:
    'Sent to dashscope-intl.aliyuncs.com (Alibaba Cloud Model Studio) with your DashScope API key.',
  keyUrl: 'https://bailian.console.alibabacloud.com/?apiKey=1',
  baseURL: BASE_URL,
  makeModel: (apiKey, modelId) => client(apiKey)(modelId),
  /** qwen-flash handles memory extraction so the planner model stays free. */
  fastModel: 'qwen-flash',
  embeddingModel: 'text-embedding-v4',
  makeEmbedding: (apiKey) => client(apiKey).textEmbeddingModel('text-embedding-v4'),
}
