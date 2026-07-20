/**
 * How hands-off an agent run is. Chosen per run (default in settings); set
 * once in the background and never taken from model output. The HIGH-risk
 * confirmation floor holds at every level (docs/adr/0003). Type + constants
 * live in `shared` so UI, protocol, and core can all reference them.
 */
export const AUTONOMY_LEVELS = ['ask', 'auto-low', 'scope'] as const
export type Autonomy = (typeof AUTONOMY_LEVELS)[number]
export const DEFAULT_AUTONOMY: Autonomy = 'scope'

export const AUTONOMY_LABELS: Record<Autonomy, string> = {
  ask: 'Ask every action',
  'auto-low': 'Auto low-risk',
  scope: 'Autopilot (confirm risky)',
}

/** Compact one-word labels for the in-composer picker; the full labels above
 * are used in Settings where there's room to explain. */
export const AUTONOMY_SHORT: Record<Autonomy, string> = {
  ask: 'Ask',
  'auto-low': 'Auto',
  scope: 'Autopilot',
}
