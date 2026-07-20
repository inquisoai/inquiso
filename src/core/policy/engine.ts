import { ALWAYS_ASK, type Capability, capabilityOf } from './capabilities'
import { getGrant } from './store'

export type PolicyDecision = 'allow' | 'deny' | 'ask' | 'defer'

export interface PolicyInput {
  tool: string
  origin?: string | undefined
}

/**
 * The deterministic policy engine — separate from the model, layered *on top*
 * of the risk gate, never below it (docs/memory-agent §16). Precedence:
 *
 *   1. reads are free
 *   2. an explicit user deny wins over everything
 *   3. ALWAYS_ASK capabilities ignore standing allows — fresh confirmation
 *   4. an explicit origin-scoped user allow skips the risk-gate prompt
 *   5. otherwise `defer` to the existing risk × autonomy gate
 *
 * Memory, model output, and page content have no write path into grants, so
 * nothing the agent remembers or reads can ever authorize a side effect.
 */
export async function decidePolicy(input: PolicyInput): Promise<PolicyDecision> {
  const capability: Capability = capabilityOf(input.tool)
  if (capability === 'read_page') return 'allow'
  const grant = input.origin ? await getGrant(input.origin, capability) : null
  if (grant?.decision === 'deny') return 'deny'
  if (ALWAYS_ASK.has(capability)) return 'ask'
  if (grant?.decision === 'allow') return 'allow'
  return 'defer'
}
