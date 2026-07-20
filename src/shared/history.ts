import { z } from 'zod'
import { AttachmentRef } from './attachment'
import { Source, TraceItem, TurnUsage, UsedMemory } from './trace'

/** One chat message as persisted; a subset of the provider ChatMessage roles.
 * User turns may carry attachment references (bytes live in the blob store).
 * Assistant turns keep the trace/sources/usage they were produced with, so a
 * reloaded conversation shows the same tool calls, citations, and cost. */
export const Turn = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  attachments: z.array(AttachmentRef).optional(),
  trace: z.array(TraceItem).optional(),
  thinkMs: z.number().optional(),
  usage: TurnUsage.optional(),
  sources: z.array(Source).optional(),
  memories: z.array(UsedMemory).optional(),
})
export type Turn = z.infer<typeof Turn>

/** A stored conversation (docs/06: keyed by id, IndexedDB, real deletes). */
export const Conversation = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  turns: z.array(Turn),
})
export type Conversation = z.infer<typeof Conversation>

/** List-view projection — everything except the turns. */
export const ConversationMeta = Conversation.omit({ turns: true })
export type ConversationMeta = z.infer<typeof ConversationMeta>

/** A portable export of all conversations — a plain JSON file the user can move
 * between browsers/profiles. Validated on import; unknown/corrupt is rejected. */
export const HistoryExport = z.object({
  v: z.literal(1),
  exportedAt: z.number(),
  conversations: z.array(Conversation),
})
export type HistoryExport = z.infer<typeof HistoryExport>
