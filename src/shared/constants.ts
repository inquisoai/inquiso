/** Stable identifiers shared across all extension surfaces. */

/** Long-lived Port name used between the side panel and the background worker. */
export const PORT_SIDEPANEL = 'inquiso:sidepanel' as const

/** Context scopes the user can chat against. See docs/04-agent-system.md. */
export const SCOPES = ['page', 'group', 'window'] as const
export type Scope = (typeof SCOPES)[number]

export const SCOPE_LABELS: Record<Scope, string> = {
  page: 'This page',
  group: 'Tab group',
  window: 'All tabs',
}

/** Max characters of page context assembled into a single prompt. */
export const MAX_CONTEXT_CHARS = 60_000

/** Wire protocol version for the messaging contract. Bump on breaking changes. */
export const PROTOCOL_VERSION = 1 as const
