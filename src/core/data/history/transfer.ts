import { HistoryExport } from '@/shared/history'
import { allConversations, saveConversation } from './store'

/**
 * Import/export of the conversation store as a portable JSON file — the
 * serverless way to move chats between browsers or profiles (no account, no
 * Inquiso backend). Cloud sync builds on this same payload.
 */
export async function exportHistory(): Promise<HistoryExport> {
  return { v: 1, exportedAt: Date.now(), conversations: await allConversations() }
}

/**
 * Validates an export payload and imports it. Each conversation gets a fresh id
 * so an import never overwrites existing chats — safe to run into any profile.
 * Returns how many were imported.
 */
export async function importHistory(data: unknown): Promise<{ imported: number }> {
  const parsed = HistoryExport.safeParse(data)
  if (!parsed.success) throw new Error('invalid_export_file')
  for (const convo of parsed.data.conversations) {
    await saveConversation({ ...convo, id: crypto.randomUUID() })
  }
  return { imported: parsed.data.conversations.length }
}
