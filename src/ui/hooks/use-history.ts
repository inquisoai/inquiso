import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Conversation, ConversationMeta } from '@/shared/history'
import { sendToBackground } from '@/ui/lib/messaging'

/** Loads one conversation. A one-shot handoff to the session — not cached. */
export function getConversation(id: string): Promise<Conversation | null> {
  return sendToBackground<Conversation | null>({ type: 'historyGet', id })
}

/** Stored conversation list + delete, cached under the ['history'] prefix.
 * The list only loads while `enabled` (menu open); deletion invalidates the
 * prefix so the cached list refetches. */
export function useHistory(enabled: boolean) {
  const client = useQueryClient()
  const { data: items = [] } = useQuery({
    queryKey: ['history', 'list'],
    queryFn: () => sendToBackground<ConversationMeta[]>({ type: 'historyList' }),
    enabled,
  })
  const { mutateAsync } = useMutation({
    mutationFn: (id: string) => sendToBackground({ type: 'historyDelete', id }),
    onSettled: () => client.invalidateQueries({ queryKey: ['history'] }),
  })
  const remove = async (id: string): Promise<void> => {
    await mutateAsync(id)
  }
  return { items, get: getConversation, remove }
}

/** Import mutation for a history export file; invalidates ['history'] so the
 * cached list picks up the new conversations. */
export function useHistoryImport() {
  const client = useQueryClient()
  const { mutateAsync } = useMutation({
    mutationFn: (data: unknown) => sendToBackground({ type: 'historyImport', data }),
    onSettled: () => client.invalidateQueries({ queryKey: ['history'] }),
  })
  return async (data: unknown): Promise<void> => {
    await mutateAsync(data)
  }
}
