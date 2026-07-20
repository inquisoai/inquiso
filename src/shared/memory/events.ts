import { z } from 'zod'
import { ActionEvidence } from './evidence'

/** Every event kind the ledger records. The ledger is append-only and is the
 * source of truth for execution history (docs/memory-agent/data-model.md). */
export const EVENT_TYPES = [
  'TaskCreated',
  'TaskResumed',
  'PageObserved',
  'MemoryRetrieved',
  'PlanCreated',
  'PlanUpdated',
  'ActionProposed',
  'PermissionRequested',
  'PermissionGranted',
  'PermissionDenied',
  'ActionStarted',
  'ActionSucceeded',
  'ActionFailed',
  'OutcomeVerified',
  'OutcomeUncertain',
  'CheckpointCreated',
  'RecoveryAttempted',
  'RecoverySucceeded',
  'GoalVerified',
  'TaskCompleted',
  'TaskAborted',
  'MemoryCandidateCreated',
  'MemoryPromoted',
  'MemorySuperseded',
  'MemoryRejected',
  'MemoryQuarantined',
  'SkillCandidateCreated',
  'SkillExecuted',
  'SkillDegraded',
  'SkillUpdated',
  'SkillRepaired',
] as const
export const EventType = z.enum(EVENT_TYPES)
export type EventType = z.infer<typeof EventType>

export const PageRef = z.object({
  url: z.string(),
  title: z.string().optional(),
  origin: z.string().optional(),
})
export type PageRef = z.infer<typeof PageRef>

/** Builds a PageRef, deriving the origin (best-effort) from the url. */
export function toPageRef(url: string, title?: string): PageRef {
  let origin: string | undefined
  try {
    origin = new URL(url).origin
  } catch {}
  return { url, ...(title ? { title } : {}), ...(origin ? { origin } : {}) }
}

export const LedgerEvent = z.object({
  id: z.string(),
  taskId: z.string(),
  runId: z.string(),
  seq: z.number().int().nonnegative(),
  at: z.number(),
  actor: z.enum(['user', 'agent', 'system', 'skill']),
  type: EventType,
  page: PageRef.optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  evidence: z.array(ActionEvidence).optional(),
  /** True when a payload value was withheld for sensitivity (docs/05). */
  redacted: z.boolean().optional(),
})
export type LedgerEvent = z.infer<typeof LedgerEvent>

export const RunOutcome = z.enum(['completed', 'aborted', 'error', 'interrupted'])
export type RunOutcome = z.infer<typeof RunOutcome>

export const RunMetrics = z.object({
  actions: z.number().int().nonnegative().default(0),
  failures: z.number().int().nonnegative().default(0),
  recoveries: z.number().int().nonnegative().default(0),
  modelCalls: z.number().int().nonnegative().default(0),
  tokens: z.number().int().nonnegative().default(0),
})
export type RunMetrics = z.infer<typeof RunMetrics>

/** One run (a single send) of a task (a conversation-scoped goal). */
export const RunMeta = z.object({
  taskId: z.string(),
  runId: z.string(),
  goal: z.string().max(500),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  outcome: RunOutcome.optional(),
  metrics: RunMetrics,
  origins: z.array(z.string()).default([]),
})
export type RunMeta = z.infer<typeof RunMeta>
