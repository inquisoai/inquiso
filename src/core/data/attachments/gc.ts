import { allConversations } from '@/core/data/history/store'
import { keepOnly } from './store'

/**
 * Garbage-collects orphaned attachment blobs: gathers every attachment id still
 * referenced by a live conversation turn and deletes any stored blob not among
 * them. A reference-count sweep (localForage has no cross-store transactions),
 * safe to run after a conversation delete and on startup as crash recovery.
 */
export async function sweepAttachments(): Promise<void> {
  const referenced = new Set<string>()
  for (const convo of await allConversations()) {
    for (const turn of convo.turns) {
      for (const ref of turn.attachments ?? []) referenced.add(ref.id)
    }
  }
  await keepOnly(referenced)
}
