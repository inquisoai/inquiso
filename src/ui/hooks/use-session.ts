import { useCallback, useEffect, useRef, useState } from 'react'
import type { PortOutbound } from '@/core/chat/protocol'
import { browser } from '@/platform'
import type { Attachment } from '@/shared/attachment'
import type { Autonomy } from '@/shared/autonomy'
import { PORT_SIDEPANEL, type Scope } from '@/shared/constants'
import type { Conversation } from '@/shared/history'
import { INITIAL, reduce } from '@/ui/features/session/reducer'
import type { SessionState } from '@/ui/features/session/types'

type Port = ReturnType<typeof browser.runtime.connect>

/** Connects the side panel to the background: drives sends, the live trace,
 * action confirmations, and which stored conversation this session continues. */
export function useSession() {
  const portRef = useRef<Port | null>(null)
  const [state, setState] = useState<SessionState>(INITIAL)
  const [conversationId, setConversationId] = useState<string | null>(null)

  useEffect(() => {
    const port = browser.runtime.connect({ name: PORT_SIDEPANEL })
    portRef.current = port
    const onMsg = (raw: unknown): void => {
      const msg = raw as PortOutbound
      if (msg.type === 'meta') setConversationId(msg.conversationId)
      setState((s) => reduce(s, msg))
    }
    port.onMessage.addListener(onMsg)
    return () => port.disconnect()
  }, [])

  const send = useCallback(
    (text: string, scope: Scope, attachments: Attachment[] = [], autonomy: Autonomy = 'scope') => {
      setState((s) => ({
        ...s,
        // Fold any leftover streamed answer (aborted run) before the new turn.
        turns: [
          ...(s.answer ? [...s.turns, { role: 'assistant' as const, content: s.answer }] : s.turns),
          {
            role: 'user' as const,
            content: text,
            ...(attachments.length ? { attachments } : {}),
          },
        ],
        answer: '',
        trace: [],
        sources: [],
        status: '',
        error: null,
        busy: true,
      }))
      portRef.current?.postMessage({
        type: 'send',
        text,
        scope,
        conversationId,
        attachments,
        autonomy,
      })
    },
    [conversationId],
  )

  /** Opens a stored conversation. */
  const load = useCallback((convo: Conversation) => {
    setConversationId(convo.id)
    setState({ ...INITIAL, turns: convo.turns })
  }, [])

  /** Starts a fresh conversation (the old one stays in history). */
  const reset = useCallback(() => {
    setConversationId(null)
    setState(INITIAL)
  }, [])

  const confirm = useCallback((id: string, approved: boolean) => {
    setState((s) => ({ ...s, confirms: s.confirms.filter((c) => c.id !== id) }))
    portRef.current?.postMessage({ type: 'confirmResult', id, approved })
  }, [])

  const stop = useCallback(() => {
    portRef.current?.postMessage({ type: 'abort' })
    setState((s) => ({ ...s, busy: false, status: '' }))
  }, [])

  return { ...state, conversationId, send, load, reset, confirm, stop }
}
