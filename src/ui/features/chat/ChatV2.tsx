import { useEffect, useState } from 'react'
import type { Conversation, ConversationMeta } from '@/shared/history'
import { t } from '@/shared/util/i18n'
import type { ChatV2Init } from '@/ui/hooks/use-chat-v2'
import { sendToBackground } from '@/ui/lib/messaging'
import { toUIMessages } from '@/ui/lib/ui-messages'
import { ChatV2Session } from './ChatV2Session'

/**
 * Experimental useChat panel (flag: localStorage.inquisoChatV2 = '1').
 * Loads the most recent conversation through the history→UIMessage boundary
 * adapter, then hands off to the AI SDK-owned session.
 */
export function ChatV2() {
  const [init, setInit] = useState<ChatV2Init | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const list = await sendToBackground<ConversationMeta[]>({ type: 'historyList' })
        const latest = list[0]
          ? await sendToBackground<Conversation | null>({ type: 'historyGet', id: list[0].id })
          : null
        setInit({
          messages: latest ? toUIMessages(latest.turns) : [],
          conversationId: latest?.id ?? null,
        })
      } catch {
        setInit({ messages: [], conversationId: null })
      }
    })()
  }, [])

  if (!init) return <p className="p-4 text-ink-dim text-sm">{t('loading', 'Loading…')}</p>
  return <ChatV2Session init={init} />
}
