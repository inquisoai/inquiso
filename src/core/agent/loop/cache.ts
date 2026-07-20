import type { SystemModelMessage } from 'ai'

/**
 * Anthropic caches a prompt prefix when it carries a `cacheControl` breakpoint.
 * Our system prompt + tool schemas are a large, stable prefix re-sent on every
 * step of a run, so marking it cuts BYOK cost and latency substantially on long
 * agentic runs. Returns a cache-marked system message for Anthropic and the
 * plain string for every other provider — OpenAI/Google cache long prefixes
 * automatically and on-device models have no server cache. Feeds the agent's
 * `instructions` (which accepts either form natively).
 */
export function instructionsFor(system: string, providerId: string): string | SystemModelMessage {
  if (providerId !== 'anthropic') return system
  return {
    role: 'system',
    content: system,
    providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
  }
}
