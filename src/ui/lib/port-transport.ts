import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai'
import type { PortOutbound } from '@/core/chat/protocol'

/** The slice of a runtime.Port this transport needs (injectable for tests). */
export interface PortLike {
  postMessage: (msg: unknown) => void
  onMessage: { addListener: (fn: (msg: unknown) => void) => void }
}

/**
 * AI SDK ChatTransport over the extension's long-lived runtime.Port — the
 * justified custom transport (docs/ai-sdk/react-tool-flow.md): there is no
 * HTTP endpoint in a serverless extension, so DefaultChatTransport cannot
 * apply. The service worker streams standard UIMessage chunks ('ui' port
 * messages, produced by the Phase-2 seam); confirmations and legacy events
 * stay out-of-band on the same port via `onOutOfBand`.
 */
export class PortChatTransport implements ChatTransport<UIMessage> {
  private conversationId: string | null = null
  private controller: ReadableStreamDefaultController<UIMessageChunk> | null = null

  constructor(
    private port: PortLike,
    private onOutOfBand?: (msg: PortOutbound) => void,
  ) {
    port.onMessage.addListener((raw) => this.receive(raw as PortOutbound))
  }

  /** Continue an existing stored conversation (e.g. loaded history). */
  seedConversation(id: string | null): void {
    this.conversationId = id
  }

  private receive(msg: PortOutbound): void {
    if (msg.type !== 'ui') {
      if (msg.type === 'error' && this.controller) {
        this.controller.enqueue({ type: 'error', errorText: msg.error })
        this.close()
        return
      }
      this.onOutOfBand?.(msg)
      return
    }
    const chunk = msg.chunk
    if (chunk.type === 'data-meta') {
      const data = chunk.data as { conversationId?: string }
      if (data?.conversationId) this.conversationId = data.conversationId
    }
    this.controller?.enqueue(chunk)
    if (chunk.type === 'finish' || chunk.type === 'abort') this.close()
  }

  private close(): void {
    this.controller?.close()
    this.controller = null
  }

  sendMessages: ChatTransport<UIMessage>['sendMessages'] = async (options) => {
    const last = options.messages.at(-1)
    const text = (last?.parts ?? []).map((p) => (p.type === 'text' ? p.text : '')).join('')
    const body = (options.body ?? {}) as { scope?: string; autonomy?: string }
    options.abortSignal?.addEventListener('abort', () => {
      this.port.postMessage({ type: 'abort' })
      this.close()
    })
    this.port.postMessage({
      type: 'send',
      text,
      scope: body.scope ?? 'page',
      conversationId: this.conversationId,
      attachments: [],
      autonomy: body.autonomy ?? 'scope',
      ui: true,
    })
    return new ReadableStream<UIMessageChunk>({
      start: (controller) => {
        this.controller = controller
      },
    })
  }

  /** No resumable stream infrastructure in a serverless extension. */
  reconnectToStream: ChatTransport<UIMessage>['reconnectToStream'] = async () => null
}
