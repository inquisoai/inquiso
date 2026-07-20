import { z } from 'zod'
import { AUTONOMY_LEVELS } from '@/shared/autonomy'
import { PROTOCOL_VERSION } from '@/shared/constants'

// Settings/config mutation messages, split out of contract.ts to keep each
// file focused (and under the line cap). Composed into RequestMsg there.
const base = z.object({ v: z.literal(PROTOCOL_VERSION) })

export const GetConfigMsg = base.extend({ type: z.literal('getConfig') })
export const ClearCacheMsg = base.extend({ type: z.literal('clearCache') })
export const SetProviderMsg = base.extend({
  type: z.literal('setProvider'),
  providerId: z.string(),
})
export const SetModelMsg = base.extend({
  type: z.literal('setModel'),
  provider: z.string(),
  modelId: z.string(),
})
export const SetApiKeyMsg = base.extend({
  type: z.literal('setApiKey'),
  provider: z.string(),
  apiKey: z.string().min(1).max(400),
})
export const RemoveApiKeyMsg = base.extend({
  type: z.literal('removeApiKey'),
  provider: z.string(),
})

export const AddProviderMsg = base.extend({
  type: z.literal('addProvider'),
  label: z.string().min(1).max(60),
  baseURL: z.string().url(),
  model: z.string().min(1).max(120),
  requiresKey: z.boolean(),
})
export const RemoveProviderMsg = base.extend({ type: z.literal('removeProvider'), id: z.string() })
export const SetReasoningMsg = base.extend({
  type: z.literal('setReasoning'),
  enabled: z.boolean(),
})
export const SetWebSearchMsg = base.extend({
  type: z.literal('setWebSearch'),
  enabled: z.boolean(),
})
export const SetAutonomyMsg = base.extend({
  type: z.literal('setAutonomy'),
  autonomy: z.enum(AUTONOMY_LEVELS),
})
export const AddMcpMsg = base.extend({
  type: z.literal('addMcp'),
  label: z.string().min(1).max(60),
  url: z.string().url(),
  token: z.string().max(400).optional(),
})
export const RemoveMcpMsg = base.extend({ type: z.literal('removeMcp'), id: z.string() })
