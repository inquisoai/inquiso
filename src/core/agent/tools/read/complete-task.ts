import { z } from 'zod'
import { defineTool } from '../context'

/**
 * Explicit, evidence-citing task completion (AI SDK migration plan §6). A run
 * must not count as done merely because the model emitted final text: calling
 * this tool records a GoalVerified ledger event with the claimed outcome and
 * the observed evidence, and a `hasToolCall('completeTask')` stop condition
 * ends the loop deterministically.
 */
export const completeTask = defineTool({
  name: 'completeTask',
  description:
    'Declare the task finished — only AFTER the goal is verifiably reached (cite the verified ' +
    'outcomes you observed). Use outcome "partial" when some of the goal remains undone. ' +
    'This ends the run.',
  risk: 'none',
  inputSchema: z.object({
    summary: z.string().min(1).max(500),
    /** What was observed that proves the goal, e.g. "download started". */
    evidence: z.string().max(500).optional(),
    outcome: z.enum(['success', 'partial', 'failed']).default('success'),
  }),
  execute: async ({ summary, evidence, outcome }, ctx) => {
    ctx.ledger?.log('GoalVerified', {
      summary,
      outcome,
      ...(evidence ? { evidence } : {}),
    })
    return { ok: true, done: true, outcome }
  },
})
