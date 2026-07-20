import { friendlyError } from '@/core/agent/errors'
import { beginTurn, completeTurn, modelHistory } from '@/core/data/history/service'
import { browser } from '@/platform'
import { PORT_SIDEPANEL } from '@/shared/constants'
import { createLogger } from '@/shared/util/logger'
import { PortInbound as Inbound, type PortInbound, type PortOutbound } from './protocol'
import { createTurnRecorder } from './record'
import { runSend } from './run-chat'
import { createSessionIO } from './session-io'

const log = createLogger('chat')
type Run = Extract<PortInbound, { type: 'send' }>

/** Background side of the unified send channel. One AbortController per
 * in-flight run; a pending map resolves action-confirmation prompts. */
export function registerChatPort(): void {
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== PORT_SIDEPANEL) return
    // A port from a tab comes from a content script inside an untrusted page —
    // it could start runs and self-approve its own confirms. Extension pages
    // (the side panel) connect with no sender.tab (docs/05 T6).
    if (port.sender?.tab) {
      log.warn('rejected port from tab')
      port.disconnect()
      return
    }
    let controller: AbortController | null = null
    const emit = (msg: PortOutbound): void => port.postMessage(msg)
    const io = createSessionIO(emit)

    // Persists the turn around the run: user turn up front, assistant turn on
    // settle — with whatever streamed (so aborted partials are remembered too).
    const begin = async (m: Run): Promise<void> => {
      if (!m.text.trim() && m.attachments.length === 0) return
      controller?.abort()
      controller = new AbortController()
      const convo = await beginTurn(m.conversationId, m.text, m.attachments)
      io.announce(m, convo.id)
      const rec = createTurnRecorder()
      const startedAt = Date.now()
      const record: typeof emit = (msg) => {
        // Stamp the run duration so both the UI and the record get "Thought for Ns".
        const out =
          msg.type === 'done' ? { type: 'done' as const, ms: Date.now() - startedAt } : msg
        rec.observe(out)
        emit(out)
      }
      try {
        await runSend(
          convo.id,
          m.text,
          m.scope,
          m.attachments,
          await modelHistory(convo),
          controller.signal,
          record,
          io.confirm,
          m.autonomy,
          io.uiSink(m),
        )
      } catch (e) {
        emit({ type: 'error', error: friendlyError(e) })
      } finally {
        const turn = rec.result()
        if (turn.content || turn.trace?.length) await completeTurn(convo.id, turn)
      }
    }

    const dispatch = (m: PortInbound): void => {
      if (m.type === 'abort') {
        controller?.abort()
      } else if (m.type !== 'confirmResult') {
        void begin(m)
      } else {
        io.resolveConfirm(m.id, m.approved)
      }
    }

    port.onMessage.addListener((raw) => {
      const parsed = Inbound.safeParse(raw)
      if (parsed.success) dispatch(parsed.data)
      else log.warn('bad port message')
    })
    port.onDisconnect.addListener(() => {
      controller?.abort()
      io.clear()
    })
  })
}
