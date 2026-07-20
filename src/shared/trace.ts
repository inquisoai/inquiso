import { z } from 'zod'

/** The reasoning + tool-call trace of an assistant turn, persisted so a
 * reloaded conversation keeps the transparency it had live (docs/04). */

export const ReasoningItem = z.object({ kind: z.literal('reasoning'), text: z.string() })
export type ReasoningItem = z.infer<typeof ReasoningItem>

export const ToolItem = z.object({
  kind: z.literal('tool'),
  callId: z.string(),
  name: z.string(),
  args: z.unknown(),
  status: z.enum(['running', 'done', 'failed']),
  error: z.string().optional(),
})
export type ToolItem = z.infer<typeof ToolItem>

export const TraceItem = z.discriminatedUnion('kind', [ReasoningItem, ToolItem])
export type TraceItem = z.infer<typeof TraceItem>

/** A web-search source the answer cited (provider citations). */
export const Source = z.object({ url: z.string(), title: z.string().optional() })
export type Source = z.infer<typeof Source>

/** What a run cost — surfaced per turn and kept for the record. */
export const TurnUsage = z.object({ tokens: z.number(), steps: z.number() })
export type TurnUsage = z.infer<typeof TurnUsage>

/** A memory the run retrieved and used — shown as "Using: …" and persisted
 * for transparency (docs/memory-agent). */
export const UsedMemory = z.object({ id: z.string(), kind: z.string(), summary: z.string() })
export type UsedMemory = z.infer<typeof UsedMemory>
