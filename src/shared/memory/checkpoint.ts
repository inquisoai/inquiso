import { z } from 'zod'
import { PageRef } from './events'

/**
 * Durable resume point for a task. Created when a run starts, advanced after
 * each verified action, removed on completion — so a checkpoint that survives
 * with status 'active' under a *different* runId marks an interrupted task
 * (MV3 worker death, browser restart, tab closure, model failure).
 */
export const Checkpoint = z.object({
  v: z.literal(1),
  taskId: z.string(),
  runId: z.string(),
  goal: z.string().max(500),
  status: z.enum(['active', 'done']),
  /** Ledger seq of the last recorded action (provenance link). */
  lastSeq: z.number().int().nonnegative(),
  lastAction: z.string().optional(),
  page: PageRef.optional(),
  /** Short human-readable notes of verified completed steps, oldest first. */
  completedSteps: z.array(z.string().max(200)).default([]),
  pendingConfirmation: z.string().optional(),
  updatedAt: z.number(),
})
export type Checkpoint = z.infer<typeof Checkpoint>
