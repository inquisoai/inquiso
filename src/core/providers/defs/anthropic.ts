import { createAnthropic } from '@ai-sdk/anthropic'
import type { ProviderDef } from '../types'

/** The header opts into Anthropic's direct browser access (CORS) — it is
 * load-bearing, so both the model and search-tool paths share one client. */
const client = (apiKey: string) =>
  createAnthropic({ apiKey, headers: { 'anthropic-dangerous-direct-browser-access': 'true' } })

export const anthropic: ProviderDef = {
  id: 'anthropic',
  label: 'Anthropic (Claude)',
  kind: 'cloud',
  requiresKey: true,
  defaultModel: 'claude-haiku-4-5',
  models: ['claude-sonnet-5', 'claude-opus-4-8', 'claude-haiku-4-5'],
  toolCalls: true,
  files: true,
  reasoning: true,
  search: true,
  dataUse:
    'Sent to api.anthropic.com with your API key. API keys only — never subscription ' +
    'OAuth, which violates Anthropic’s terms (see docs/03-providers-and-auth.md).',
  keyUrl: 'https://console.anthropic.com/settings/keys',
  makeModel: (apiKey, modelId) => client(apiKey)(modelId),
  makeSearchTool: (apiKey) => ({
    web_search: client(apiKey).tools.webSearch_20260209(),
  }),
}
