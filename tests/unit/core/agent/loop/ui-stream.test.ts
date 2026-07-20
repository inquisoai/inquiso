import { readUIMessageStream, simulateReadableStream, tool, type UIMessage } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { buildBrowserAgent } from '@/core/agent/loop/agent'
import { createMeter } from '@/core/agent/loop/budget'
import { type Part, relay } from '@/core/agent/loop/relay'
import type { PortOutbound } from '@/core/chat/protocol'
import type { ActiveModel } from '@/core/providers/resolve'

const finish = (unified: 'stop' | 'tool-calls') => ({
  type: 'finish' as const,
  finishReason: { unified, raw: undefined },
  logprobs: undefined,
  usage: {
    inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
    outputTokens: { total: 10, text: 10, reasoning: undefined },
  },
})

const toolStep = simulateReadableStream({
  chunks: [
    { type: 'tool-call' as const, toolCallId: 'call-1', toolName: 'ping', input: '{"n":1}' },
    finish('tool-calls'),
  ],
})
const textStep = simulateReadableStream({
  chunks: [
    { type: 'text-start' as const, id: 't1' },
    { type: 'text-delta' as const, id: 't1', delta: 'All done.' },
    { type: 'text-end' as const, id: 't1' },
    finish('stop'),
  ],
})

const ping = tool({
  description: 'test tool',
  inputSchema: z.object({ n: z.number() }),
  execute: async () => ({ ok: true }),
})

// Golden parity run (migration plan §2 acceptance): the UIMessage view of a
// run must carry the same content the PortOutbound relay shows the panel.
describe('dual-protocol seam: UIMessage stream parity with the relay', () => {
  it('text, tool call, and tool result match across both protocols', async () => {
    const streams = [toolStep, textStep]
    const model = new MockLanguageModelV3({
      doStream: async () => ({ stream: streams.shift() ?? textStep }),
    })
    const agent = buildBrowserAgent(
      { model, providerId: 'mock', vision: false } as ActiveModel,
      { ping },
      createMeter(Date.now()),
    )
    const result = await agent.stream({ prompt: 'go', options: { taskId: 't', runId: 'r' } })

    // Consume both views concurrently (they tee from the same base stream).
    const port: PortOutbound[] = []
    const uiMessages: UIMessage[] = []
    await Promise.all([
      (async () => {
        for await (const part of result.fullStream as AsyncIterable<Part>) {
          relay(part, (msg) => port.push(msg))
        }
      })(),
      (async () => {
        for await (const m of readUIMessageStream({ stream: result.toUIMessageStream() })) {
          uiMessages.push(m)
        }
      })(),
    ])

    // Relay (canonical protocol) view.
    const portText = port
      .filter((m): m is Extract<PortOutbound, { type: 'chunk' }> => m.type === 'chunk')
      .map((m) => m.text)
      .join('')
    const portTool = port.find((m) => m.type === 'tool')
    const portToolResult = port.find((m) => m.type === 'tool-result')

    // UIMessage view (final state of the assistant message).
    const final = uiMessages.at(-1)
    const uiText = (final?.parts ?? [])
      .filter((p): p is Extract<UIMessage['parts'][number], { type: 'text' }> => p.type === 'text')
      .map((p) => p.text)
      .join('')
    const uiTool = (final?.parts ?? []).find((p) => p.type === 'tool-ping') as
      | { type: string; toolCallId: string; state: string; input: unknown }
      | undefined

    expect(portText).toBe('All done.')
    expect(uiText).toBe('All done.')
    expect(portTool && 'name' in portTool ? portTool.name : '').toBe('ping')
    expect(uiTool?.toolCallId).toBe('call-1')
    expect(uiTool?.input).toEqual({ n: 1 })
    expect(uiTool?.state).toBe('output-available')
    expect(portToolResult && 'ok' in portToolResult ? portToolResult.ok : false).toBe(true)
  })
})
