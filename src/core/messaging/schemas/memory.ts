import { z } from 'zod'
import { PROTOCOL_VERSION } from '@/shared/constants'
import { SCOPE_LEVELS } from '@/shared/memory/enums'

// Memory Center messages, split out of contract.ts to keep files within the
// line cap. Composed into RequestMsg there.
const base = z.object({ v: z.literal(PROTOCOL_VERSION) })

export const MemoryListMsg = base.extend({ type: z.literal('memoryList') })
export const MemoryForgetMsg = base.extend({ type: z.literal('memoryForget'), id: z.string() })
export const MemoryConfirmMsg = base.extend({ type: z.literal('memoryConfirm'), id: z.string() })
export const MemoryIncorrectMsg = base.extend({
  type: z.literal('memoryIncorrect'),
  id: z.string(),
})
export const MemoryEditMsg = base.extend({
  type: z.literal('memoryEdit'),
  id: z.string(),
  summary: z.string().min(1).max(500),
})
export const MemoryScopeMsg = base.extend({
  type: z.literal('memoryScope'),
  id: z.string(),
  level: z.enum(SCOPE_LEVELS),
})
export const MemoryClearMsg = base.extend({
  type: z.literal('memoryClear'),
  origin: z.string().optional(),
})
export const MemoryBlockedMsg = base.extend({ type: z.literal('memoryBlocked') })
export const MemoryRunsMsg = base.extend({ type: z.literal('memoryRuns') })
export const MemoryExportMsg = base.extend({ type: z.literal('memoryExport') })
export const MemoryStateMsg = base.extend({ type: z.literal('memoryState') })
export const MemorySetLearningMsg = base.extend({
  type: z.literal('memorySetLearning'),
  enabled: z.boolean(),
})
export const MemorySkillsMsg = base.extend({ type: z.literal('memorySkills') })
export const MemoryTrustSkillMsg = base.extend({
  type: z.literal('memoryTrustSkill'),
  id: z.string(),
})
export const MemoryRetireSkillMsg = base.extend({
  type: z.literal('memoryRetireSkill'),
  id: z.string(),
})

/** All Memory Center messages, spread into RequestMsg (contract.ts). */
export const memoryMsgs = [
  MemoryListMsg,
  MemoryForgetMsg,
  MemoryConfirmMsg,
  MemoryIncorrectMsg,
  MemoryEditMsg,
  MemoryScopeMsg,
  MemoryClearMsg,
  MemoryBlockedMsg,
  MemoryRunsMsg,
  MemoryExportMsg,
  MemoryStateMsg,
  MemorySetLearningMsg,
  MemorySkillsMsg,
  MemoryTrustSkillMsg,
  MemoryRetireSkillMsg,
] as const
