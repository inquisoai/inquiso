import type { UIMessage, UIMessageChunk } from 'ai'
import { describe, expect, it } from 'vitest'
import type { PortOutbound } from '@/core/chat/protocol'
import { PortChatTransport, type PortLike } from '@/ui/lib/port-transport'

function fakePort() {
  const posted: unknown[] = []
  const listeners: Array<(msg: unknown) => void> = []
  const port: PortLike = {
    postMessage: (m) => posted.push(m),
    onMessage: { addListener: (fn) => listeners.push(fn) },
  }
  const receive = (m: PortOutbound): void => {
    for (const l of listeners) l(m)
  }
  return { port, posted, receive }
}

const userMessage: UIMessage = {
  id: 'u1',
  role: 'user',
  parts: [{ type: 'text', text: 'download the invoice' }],
}

const send = (transport: PortChatTransport) =>
  transport.sendMessages({
    trigger: 'submit-message',
    chatId: 'chat1',
    messageId: undefined,
    messages: [userMessage],
    abortSignal: undefined,
  })

async function drain(stream: ReadableStream<UIMessageChunk>): Promise<UIMessageChunk[]> {
  const out: UIMessageChunk[] = []
  for await (const chunk of stream as unknown as AsyncIterable<UIMessageChunk>) out.push(chunk)
  return out
}

describe('PortChatTransport', () => {
  it('posts a validated SendRequest with ui:true and the tracked conversation', async () => {
    const { port, posted, receive } = fakePort()
    const transport = new PortChatTransport(port)
    const stream = await send(transport)
    expect(posted[0]).toMatchObject({
      type: 'send',
      text: 'download the invoice',
      ui: true,
      conversationId: null,
    })

    receive({ type: 'ui', chunk: { type: 'data-meta', data: { conversationId: 'convo-9' } } })
    receive({ type: 'ui', chunk: { type: 'finish' } })
    await drain(stream)

    await send(transport)
    expect(posted[1]).toMatchObject({ type: 'send', conversationId: 'convo-9' })
  })

  it('streams chunks until finish and routes non-ui messages out-of-band', async () => {
    const { port, receive } = fakePort()
    const outOfBand: PortOutbound[] = []
    const transport = new PortChatTransport(port, (m) => outOfBand.push(m))
    const stream = await send(transport)

    receive({ type: 'confirm', id: 'c1', tool: 'click', args: {} })
    receive({ type: 'ui', chunk: { type: 'text-start', id: 't1' } })
    receive({ type: 'ui', chunk: { type: 'text-delta', id: 't1', delta: 'hi' } })
    receive({ type: 'ui', chunk: { type: 'text-end', id: 't1' } })
    receive({ type: 'ui', chunk: { type: 'finish' } })

    const chunks = await drain(stream)
    expect(chunks.map((c) => c.type)).toEqual(['text-start', 'text-delta', 'text-end', 'finish'])
    expect(outOfBand.map((m) => m.type)).toEqual(['confirm'])
  })

  it('turns a run error into an error chunk and closes the stream', async () => {
    const { port, receive } = fakePort()
    const transport = new PortChatTransport(port)
    const stream = await send(transport)
    receive({ type: 'error', error: 'boom' })
    const chunks = await drain(stream)
    expect(chunks).toEqual([{ type: 'error', errorText: 'boom' }])
  })

  it('abort posts the abort message', async () => {
    const { port, posted } = fakePort()
    const abort = new AbortController()
    await new PortChatTransport(port).sendMessages({
      trigger: 'submit-message',
      chatId: 'chat1',
      messageId: undefined,
      messages: [userMessage],
      abortSignal: abort.signal,
    })
    abort.abort()
    expect(posted.at(-1)).toEqual({ type: 'abort' })
  })
})
