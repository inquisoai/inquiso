import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'
import { useMemo, useState } from 'react'
import { browser } from '@/platform'
import { PORT_SIDEPANEL } from '@/shared/constants'
import type { UsedMemory } from '@/shared/trace'
import type { ConfirmReq } from '@/ui/features/session/types'
import { PortChatTransport } from '@/ui/lib/port-transport'

export interface ChatV2Init {
  messages: UIMessage[]
  conversationId: string | null
}

/**
 * Experimental useChat-based session (AI SDK migration plan §3–4), behind the
 * `inquisoChatV2` localStorage flag. The AI SDK owns message state and
 * streaming over the Port transport; confirmations, live memory chips, and
 * status lines remain out-of-band on the same port.
 */
export function useChatV2(init: ChatV2Init) {
  const [confirms, setConfirms] = useState<ConfirmReq[]>([])
  const [memories, setMemories] = useState<UsedMemory[]>([])
  const [statusLine, setStatusLine] = useState('')
  const port = useMemo(() => browser.runtime.connect({ name: PORT_SIDEPANEL }), [])
  const transport = useMemo(() => {
    const t = new PortChatTransport(port, (msg) => {
      if (msg.type === 'confirm') {
        setConfirms((c) => [...c, { id: msg.id, tool: msg.tool, args: msg.args }])
      } else if (msg.type === 'memory') {
        setMemories(msg.items)
      } else if (msg.type === 'status') {
        setStatusLine(msg.status)
      } else if (msg.type === 'done' || msg.type === 'error') {
        setStatusLine('')
      }
    })
    t.seedConversation(init.conversationId)
    return t
  }, [port, init.conversationId])
  const chat = useChat({ transport, messages: init.messages })

  const confirm = (id: string, approved: boolean): void => {
    port.postMessage({ type: 'confirmResult', id, approved })
    setConfirms((c) => c.filter((x) => x.id !== id))
  }

  return { ...chat, confirms, confirm, memories, statusLine }
}

export const chatV2Enabled = (): boolean => {
  try {
    return localStorage.getItem('inquisoChatV2') === '1'
  } catch {
    return false
  }
}
