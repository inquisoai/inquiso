import { describe, expect, it } from 'vitest'
import type { PortOutbound } from '@/core/chat/protocol'
import { createTurnRecorder } from '@/core/chat/record'

const feed = (msgs: PortOutbound[]) => {
  const rec = createTurnRecorder()
  for (const m of msgs) rec.observe(m)
  return rec.result()
}

describe('turn recorder', () => {
  it('keeps only the post-tool answer as content, plan text moves to the trace', () => {
    const turn = feed([
      { type: 'chunk', text: 'Let me check the page. ' },
      { type: 'tool', callId: 'c1', name: 'readPage', args: {} },
      { type: 'tool-result', callId: 'c1', ok: true },
      { type: 'chunk', text: 'The answer is 42.' },
      { type: 'done', ms: 2500 },
    ])
    expect(turn.content).toBe('The answer is 42.')
    expect(turn.thinkMs).toBe(2500)
    // trace holds the plan (as reasoning) then the settled tool call.
    expect(turn.trace).toEqual([
      { kind: 'reasoning', text: 'Let me check the page. ' },
      { kind: 'tool', callId: 'c1', name: 'readPage', args: {}, status: 'done' },
    ])
  })

  it('records token usage from the last budget and dedupes sources', () => {
    const turn = feed([
      { type: 'budget', steps: 1, ms: 100, tokens: 10 },
      { type: 'source', url: 'https://a.com', title: 'A' },
      { type: 'source', url: 'https://a.com' },
      { type: 'budget', steps: 3, ms: 900, tokens: 850 },
      { type: 'chunk', text: 'done' },
      { type: 'done', ms: 900 },
    ])
    expect(turn.usage).toEqual({ tokens: 850, steps: 3 })
    expect(turn.sources).toEqual([{ url: 'https://a.com', title: 'A' }])
  })

  it('marks a failed tool and omits empty metrics for a plain answer', () => {
    const failed = feed([
      { type: 'tool', callId: 'c1', name: 'click', args: { handle: 'x' } },
      { type: 'tool-result', callId: 'c1', ok: false, error: 'element_not_found' },
    ])
    expect(failed.trace?.[0]).toMatchObject({ status: 'failed', error: 'element_not_found' })

    const plain = feed([{ type: 'chunk', text: 'hi' }, { type: 'done' }])
    expect(plain).toEqual({ content: 'hi' }) // no trace/usage/sources/thinkMs
  })
})
