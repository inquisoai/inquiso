import { z } from 'zod'
import { CAPABILITIES } from '@/core/policy/capabilities'
import { PROTOCOL_VERSION } from '@/shared/constants'

// Policy-grant messages, split out of contract.ts to keep files within the
// line cap. Composed into RequestMsg there.
const base = z.object({ v: z.literal(PROTOCOL_VERSION) })

export const PolicyListMsg = base.extend({ type: z.literal('policyList') })
export const PolicySetMsg = base.extend({
  type: z.literal('policySet'),
  origin: z.string().url(),
  capability: z.enum(CAPABILITIES),
  decision: z.enum(['allow', 'deny']),
})
export const PolicyRemoveMsg = base.extend({
  type: z.literal('policyRemove'),
  origin: z.string(),
  capability: z.enum(CAPABILITIES),
})

export const policyMsgs = [PolicyListMsg, PolicySetMsg, PolicyRemoveMsg] as const
