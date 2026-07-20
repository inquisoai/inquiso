import type { ModelMessage } from 'ai'
import { dataUrlToBlob, getAttachmentBlob, putAttachment } from '@/core/data/attachments/store'
import { type Attachment, type AttachmentRef, attachmentsLabel } from '@/shared/attachment'
import type { Conversation, Turn } from '@/shared/history'
import { getConversation, saveConversation } from './store'

const TITLE_MAX = 60
/** Prior turns sent to the model — bounded so history never crowds out the
 * page context (docs/06, token-budget management). */
const MAX_HISTORY_TURNS = 12

/** Persists each attachment's bytes as a Blob and returns the refs to store on
 * the turn. On-device only; the model still gets the data URL separately. */
async function persistAttachments(attachments: Attachment[]): Promise<AttachmentRef[]> {
  return Promise.all(
    attachments.map(async ({ id, name, mediaType, dataUrl }) => {
      await putAttachment({ id, name, mediaType, blob: dataUrlToBlob(dataUrl) })
      return { id, name, mediaType }
    }),
  )
}

/** Loads (or creates) the conversation and appends the user turn. Persists the
 * real user text as content (empty for attachment-only) and the filenames as
 * the conversation title only — never a fake filename "message". */
export async function beginTurn(
  id: string | null,
  text: string,
  attachments: Attachment[] = [],
): Promise<Conversation> {
  const existing = id ? await getConversation(id) : null
  const now = Date.now()
  const convo: Conversation = existing ?? {
    id: crypto.randomUUID(),
    title: text.trim() ? text.slice(0, TITLE_MAX) : attachmentsLabel(attachments),
    createdAt: now,
    updatedAt: now,
    turns: [],
  }
  const refs = attachments.length ? await persistAttachments(attachments) : []
  const turn: Turn = { role: 'user', content: text, ...(refs.length ? { attachments: refs } : {}) }
  const updated: Conversation = { ...convo, updatedAt: now, turns: [...convo.turns, turn] }
  await saveConversation(updated)
  return updated
}

/** Appends the assistant reply with its trace/sources/usage (also called with
 * partial content on abort, so what the user saw is what the model remembers). */
export async function completeTurn(id: string, turn: Omit<Turn, 'role'>): Promise<void> {
  const convo = await getConversation(id)
  if (!convo) return
  await saveConversation({
    ...convo,
    updatedAt: Date.now(),
    turns: [...convo.turns, { role: 'assistant', ...turn }],
  })
}

/** Rebuilds a stored turn as a model message, re-attaching any images from the
 * on-device blob store so the model can still "see" them on later turns. */
async function toModelMessage(turn: Turn): Promise<ModelMessage> {
  if (turn.role === 'user' && turn.attachments?.length) {
    const parts = (
      await Promise.all(
        turn.attachments.map(async (a) => {
          const blob = await getAttachmentBlob(a.id)
          return blob
            ? {
                type: 'file' as const,
                mediaType: a.mediaType,
                data: new Uint8Array(await blob.arrayBuffer()),
              }
            : null
        }),
      )
    ).filter((p) => p !== null)
    if (parts.length) {
      return {
        role: 'user',
        content: turn.content.trim()
          ? [{ type: 'text' as const, text: turn.content }, ...parts]
          : parts,
      }
    }
  }
  return { role: turn.role, content: turn.content || '[attachment no longer available]' }
}

/** Prior turns for the model: everything before the just-appended user turn,
 * trimmed to the recency window, with images re-attached from storage. */
export async function modelHistory(convo: Conversation): Promise<ModelMessage[]> {
  const turns = convo.turns.slice(0, -1).slice(-MAX_HISTORY_TURNS)
  return Promise.all(turns.map(toModelMessage))
}
