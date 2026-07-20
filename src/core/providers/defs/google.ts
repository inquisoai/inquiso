import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { ProviderDef } from '../types'

export const google: ProviderDef = {
  id: 'google',
  label: 'Google (Gemini)',
  kind: 'cloud',
  requiresKey: true,
  defaultModel: 'gemini-3.5-flash',
  models: ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3-pro-preview'],
  toolCalls: true,
  files: true,
  reasoning: true,
  search: true,
  dataUse:
    'Sent to generativelanguage.googleapis.com with your AI Studio key. The free tier may ' +
    'be used for training — prefer the paid tier or Chrome AI for sensitive pages.',
  keyUrl: 'https://aistudio.google.com/apikey',
  makeModel: (apiKey, modelId) => createGoogleGenerativeAI({ apiKey })(modelId),
  embeddingModel: 'text-embedding-004',
  makeEmbedding: (apiKey) =>
    createGoogleGenerativeAI({ apiKey }).textEmbeddingModel('text-embedding-004'),
  makeSearchTool: (apiKey) => ({
    google_search: createGoogleGenerativeAI({ apiKey }).tools.googleSearch({}),
  }),
}
