import { appStore } from '@/core/data/storage/instance'
import { Conversation, type ConversationMeta } from '@/shared/history'

/**
 * Conversation store (IndexedDB via localForage — docs/06-caching-memory.md).
 * Local only, never synced; deletes are real record removals. Reads are
 * Zod-validated: a corrupt record is treated as absent, never trusted.
 */
const store = appStore('conversations')
const MAX_CONVERSATIONS = 200

export async function getConversation(id: string): Promise<Conversation | null> {
  const parsed = Conversation.safeParse(await store.getItem(id))
  return parsed.success ? parsed.data : null
}

export async function saveConversation(convo: Conversation): Promise<void> {
  await store.setItem(convo.id, convo)
  await trim()
}

export async function deleteConversation(id: string): Promise<void> {
  await store.removeItem(id)
}

/** Every full conversation (validated), newest first — for export. */
export async function allConversations(): Promise<Conversation[]> {
  const all: Conversation[] = []
  await store.iterate((value) => {
    const parsed = Conversation.safeParse(value)
    if (parsed.success) all.push(parsed.data)
  })
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Metadata projection of allConversations (localforage materializes full
 * values during iterate anyway, so a separate scan saves nothing). */
export async function listConversations(): Promise<ConversationMeta[]> {
  return (await allConversations()).map(({ turns: _, ...meta }) => meta)
}

/** Drops the least-recently-updated conversations once over the retention cap. */
async function trim(): Promise<void> {
  const excess = (await listConversations()).slice(MAX_CONVERSATIONS)
  await Promise.all(excess.map((m) => store.removeItem(m.id)))
}
