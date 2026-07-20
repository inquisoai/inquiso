import type { JSONValue } from 'ai'

/** streamText's providerOptions shape (not exported by name from `ai`). */
export type ProviderOpts = Record<string, Record<string, JSONValue>>

/** Per-provider options that enable (and surface) the model's reasoning stream.
 * Only for providers whose reasoning shape we know; effort/budget kept modest
 * since it costs the user tokens. The relay turns the resulting reasoning-delta
 * parts into the Thoughts trace. */
const OPTIONS: Record<string, ProviderOpts> = {
  anthropic: { anthropic: { thinking: { type: 'enabled', budgetTokens: 2048 } } },
  openai: { openai: { reasoningEffort: 'low', reasoningSummary: 'auto' } },
  google: { google: { thinkingConfig: { includeThoughts: true } } },
}

export const reasoningOptions = (providerId: string): ProviderOpts | undefined =>
  OPTIONS[providerId]
