import { type Autonomy, riskGate } from './autonomy'
import { riskOf } from './tools/registry'

/** The confirmation gate. Enforced in the background BEFORE dispatching and
 * un-overridable by model output (docs/05, docs/adr/0003). Risk lives on each
 * tool's definition; a tool's `confirmWhen` floor is applied in the registry. */

/** Whether a tool needs confirmation at the run's autonomy level. HIGH always
 * confirms; unknown tools resolve to high upstream (fail-safe). */
export const needsConfirm = (tool: string, autonomy: Autonomy): boolean =>
  riskGate(riskOf(tool), autonomy)
