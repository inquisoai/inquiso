import type { UIMessageChunk } from 'ai'
import { z } from 'zod'
import { Attachment, MAX_FILES } from '@/shared/attachment'
import { AUTONOMY_LEVELS } from '@/shared/autonomy'
import { SCOPES } from '@/shared/constants'

/** Messages the side panel sends over the Port (validated, untrusted). */
export const SendRequest = z.object({
  type: z.literal('send'),
  // May be empty when the message is attachment-only; the port drops a send
  // that has neither text nor attachments.
  text: z.string().max(8000),
  scope: z.enum(SCOPES),
  /** null starts a new conversation; the id comes back in a 'meta' message. */
  conversationId: z.string().nullable(),
  attachments: z.array(Attachment).max(MAX_FILES).default([]),
  /** How hands-off this run is (default set in the UI from settings). */
  autonomy: z.enum(AUTONOMY_LEVELS).default('scope'),
  /** Also stream AI SDK UIMessage chunks ('ui' outbound messages) — set by
   * the useChat transport (AI SDK migration plan §3). */
  ui: z.boolean().default(false),
})
export const AbortRequest = z.object({ type: z.literal('abort') })
export const ConfirmResult = z.object({
  type: z.literal('confirmResult'),
  id: z.string(),
  approved: z.boolean(),
})

export const PortInbound = z.discriminatedUnion('type', [SendRequest, AbortRequest, ConfirmResult])
export type PortInbound = z.infer<typeof PortInbound>

/** Messages the background streams back to the side panel. */
export type PortOutbound =
  | { type: 'meta'; conversationId: string }
  | { type: 'ui'; chunk: UIMessageChunk }
  | { type: 'memory'; items: { id: string; kind: string; summary: string }[] }
  | { type: 'status'; status: string }
  | { type: 'chunk'; text: string }
  | { type: 'reasoning'; text: string }
  | { type: 'tool'; callId: string; name: string; args: unknown }
  | { type: 'tool-result'; callId: string; ok: boolean; error?: string }
  | { type: 'confirm'; id: string; tool: string; args: unknown }
  | { type: 'budget'; steps: number; ms: number; tokens: number }
  | { type: 'source'; url: string; title?: string }
  | { type: 'done'; ms?: number }
  | { type: 'error'; error: string }
