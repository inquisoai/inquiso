import { describe, expect, it } from 'vitest'
import type { Turn } from '@/shared/history'
import { toUIMessages } from '@/ui/lib/ui-messages'

const turns: Turn[] = [
  { role: 'user', content: 'download the newest invoice' },
  {
    role: 'assistant',
    content: 'Done — INV-023 downloaded.',
    trace: [
      { kind: 'reasoning', text: 'I will open billing first.' },
      { kind: 'tool', callId: 'c1', name: 'click', args: { handle: 'iq-1' }, status: 'done' },
      {
        kind: 'tool',
        callId: 'c2',
        name: 'click',
        args: { handle: 'iq-9' },
        status: 'failed',
        error: 'element_not_found',
      },
    ],
    memories: [{ id: 'mem_1', kind: 'site_knowledge', summary: 'Billing is under Account.' }],
    usage: { tokens: 900, steps: 4 },
    thinkMs: 5200,
  },
]

describe('toUIMessages (history → useChat boundary adapter)', () => {
  it('maps roles, text, reasoning, tools with states, memories, and metadata', () => {
    const [user, assistant] = toUIMessages(turns)
    expect(user?.role).toBe('user')
    expect(user?.parts).toEqual([{ type: 'text', text: 'download the newest invoice' }])

    const parts = assistant?.parts ?? []
    expect(parts[0]).toEqual({ type: 'reasoning', text: 'I will open billing first.' })
    expect(parts[1]).toMatchObject({
      type: 'tool-click',
      toolCallId: 'c1',
      state: 'output-available',
      input: { handle: 'iq-1' },
    })
    expect(parts[2]).toMatchObject({
      type: 'tool-click',
      toolCallId: 'c2',
      state: 'output-error',
      errorText: 'element_not_found',
    })
    expect(parts[3]).toMatchObject({ type: 'data-memory' })
    expect(parts.at(-1)).toEqual({ type: 'text', text: 'Done — INV-023 downloaded.' })
    expect(
      (assistant as { metadata?: { usage?: { tokens: number } } }).metadata?.usage?.tokens,
    ).toBe(900)
  })

  it('a plain text-only turn maps to a single text part', () => {
    const [m] = toUIMessages([{ role: 'assistant', content: 'hello' }])
    expect(m?.parts).toEqual([{ type: 'text', text: 'hello' }])
  })
})
