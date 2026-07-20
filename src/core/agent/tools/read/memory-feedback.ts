import { z } from 'zod'
import { feedbackMisleading, feedbackUseful } from '@/core/memory/store/feedback'
import { defineTool } from '../context'

/**
 * Narrow memory-feedback tools. The model reports how retrieved memories
 * performed; the counters feed retrieval ranking (useful ↑, misleading ↓ with
 * a staleness penalty) — but promotion, confidence, confirmation, and
 * deletion remain with the deterministic pipeline and the user.
 */
export const markMemoryUseful = defineTool({
  name: 'markMemoryUseful',
  description:
    'Report that a retrieved memory (by id from the memory context) genuinely helped this task.',
  risk: 'none',
  inputSchema: z.object({ memoryId: z.string() }),
  execute: async ({ memoryId }) => ({ ok: await feedbackUseful(memoryId) }),
})

export const markMemoryMisleading = defineTool({
  name: 'markMemoryMisleading',
  description:
    'Report that a retrieved memory (by id) was wrong or misleading for this task — e.g. the ' +
    'live page contradicted it. This lowers its ranking; it does not delete it.',
  risk: 'none',
  inputSchema: z.object({ memoryId: z.string(), reason: z.string().max(300).optional() }),
  execute: async ({ memoryId, reason }, ctx) => {
    const ok = await feedbackMisleading(memoryId)
    if (ok)
      ctx.ledger?.log('MemoryRejected', {
        id: memoryId,
        stale: true,
        ...(reason ? { reason } : {}),
      })
    return { ok }
  },
})
