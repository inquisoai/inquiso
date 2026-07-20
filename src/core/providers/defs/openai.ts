import { createOpenAI } from '@ai-sdk/openai'
import type { ProviderDef } from '../types'

export const openai: ProviderDef = {
  id: 'openai',
  label: 'OpenAI',
  kind: 'cloud',
  requiresKey: true,
  defaultModel: 'gpt-5.4-mini',
  models: ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano'],
  toolCalls: true,
  files: true,
  reasoning: true,
  search: true,
  dataUse: 'Sent to api.openai.com with your API key; subject to OpenAI’s API data policy.',
  keyUrl: 'https://platform.openai.com/api-keys',
  makeModel: (apiKey, modelId) => createOpenAI({ apiKey })(modelId),
  embeddingModel: 'text-embedding-3-small',
  makeEmbedding: (apiKey) => createOpenAI({ apiKey }).textEmbeddingModel('text-embedding-3-small'),
  makeSearchTool: (apiKey) => ({ web_search: createOpenAI({ apiKey }).tools.webSearch() }),
  makeTranscription: (apiKey) => createOpenAI({ apiKey }).transcription('whisper-1'),
  makeSpeech: (apiKey) => createOpenAI({ apiKey }).speech('tts-1'),
}
