import type { Autonomy } from '@/shared/autonomy'
import type { Risk } from './tools/context'

export { AUTONOMY_LEVELS, type Autonomy, DEFAULT_AUTONOMY } from '@/shared/autonomy'

/** Whether a risk level requires confirmation at a given autonomy level.
 * HIGH always confirms; unknown tools resolve to high upstream (fail-safe).
 * This gate is enforced in the background and is un-overridable by the model. */
export function riskGate(risk: Risk, autonomy: Autonomy): boolean {
  if (risk === 'high') return true
  if (risk === 'none') return false
  if (risk === 'low') return autonomy === 'ask'
  return autonomy !== 'scope' // medium: confirm unless in scope
}
