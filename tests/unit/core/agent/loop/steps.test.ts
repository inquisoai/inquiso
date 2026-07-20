import type { ModelMessage } from 'ai'
import { describe, expect, it } from 'vitest'
import { compactStep } from '@/core/agent/loop/steps'

const messages: ModelMessage[] = [
  { role: 'user', content: 'huge page envelope…' },
  {
    role: 'assistant',
    content: [{ type: 'tool-call', toolCallId: '1', toolName: 'readPage', input: {} }],
  },
  {
    role: 'tool',
    content: [
      {
        type: 'tool-result',
        toolCallId: '1',
        toolName: 'readPage',
        output: { type: 'text', value: 'x'.repeat(5000) },
      },
    ],
  },
  { role: 'assistant', content: 'Here is the summary.' },
]

describe('compactStep', () => {
  it('is a no-op on the first step', () => {
    expect(compactStep({ stepNumber: 0, messages })).toEqual({})
  })

  it('returns a pruned message list on later steps, keeping the most recent', () => {
    const out = compactStep({ stepNumber: 2, messages })
    expect(Array.isArray(out.messages)).toBe(true)
    // The latest assistant message (working set) survives compaction.
    expect(out.messages?.at(-1)).toEqual({ role: 'assistant', content: 'Here is the summary.' })
  })
})
