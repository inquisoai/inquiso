import type { UIMessageChunk } from 'ai'
import type { Confirm } from '@/core/agent/types'
import type { PortInbound, PortOutbound } from './protocol'

type Emit = (msg: PortOutbound) => void
type Run = Extract<PortInbound, { type: 'send' }>

/**
 * Per-connection plumbing for the chat port: the confirmation round-trip
 * (in-execution pause resolved by the panel) and the useChat-protocol extras
 * (conversation-id data chunk + UIMessage chunk forwarding when the client
 * opted in with `ui: true`).
 */
export function createSessionIO(emit: Emit) {
  let seq = 0
  const pending = new Map<string, (approved: boolean) => void>()

  const confirm: Confirm = (tool, args) =>
    new Promise((resolve) => {
      seq += 1
      const id = `c${seq}`
      pending.set(id, resolve)
      emit({ type: 'confirm', id, tool, args })
    })

  const resolveConfirm = (id: string, approved: boolean): void => {
    const resolve = pending.get(id)
    pending.delete(id)
    resolve?.(approved)
  }

  const announce = (m: Run, conversationId: string): void => {
    emit({ type: 'meta', conversationId })
    if (m.ui) emit({ type: 'ui', chunk: { type: 'data-meta', data: { conversationId } } })
  }

  const uiSink = (m: Run) =>
    m.ui ? (chunk: UIMessageChunk) => emit({ type: 'ui', chunk }) : undefined

  return { confirm, resolveConfirm, announce, uiSink, clear: () => pending.clear() }
}
