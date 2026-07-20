import type { ModelMessage } from 'ai'
import type { Attachment } from '@/shared/attachment'

/** The final user turn: prompt text plus any attachments as AI SDK file parts
 * (a multimodal message) — plain text when there are none. */
export function userMessage(text: string, attachments: Attachment[]): ModelMessage {
  if (attachments.length === 0) return { role: 'user', content: text }
  const files = attachments.map((a) => ({
    type: 'file' as const,
    mediaType: a.mediaType,
    data: a.dataUrl,
  }))
  // No text part for an attachment-only turn, so the model gets a clean file message.
  return { role: 'user', content: text.trim() ? [{ type: 'text', text }, ...files] : files }
}
