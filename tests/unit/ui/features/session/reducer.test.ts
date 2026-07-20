import { describe, expect, it } from 'vitest'
import { INITIAL, reduce } from '@/ui/features/session/reducer'
import type { TraceItem } from '@/ui/features/session/types'

const toolItem = (s: ReturnType<typeof reduce>): TraceItem | undefined => s.trace.at(-1)

describe('session reducer', () => {
  it('appends streamed answer chunks', () => {
    const s = reduce(reduce(INITIAL, { type: 'chunk', text: 'Hel' }), { type: 'chunk', text: 'lo' })
    expect(s.answer).toBe('Hello')
  })

  it('accumulates reasoning deltas into a single item', () => {
    let s = reduce(INITIAL, { type: 'reasoning', text: 'I will ' })
    s = reduce(s, { type: 'reasoning', text: 'read the page.' })
    expect(s.trace).toHaveLength(1)
    expect(toolItem(s)).toEqual({ kind: 'reasoning', text: 'I will read the page.' })
  })

  it('marks a tool call done on a successful result', () => {
    let s = reduce(INITIAL, { type: 'tool', callId: 'c1', name: 'click', args: {} })
    s = reduce(s, { type: 'tool-result', callId: 'c1', ok: true })
    expect(toolItem(s)).toMatchObject({ kind: 'tool', status: 'done' })
  })

  it('marks a tool call failed with its error', () => {
    let s = reduce(INITIAL, { type: 'tool', callId: 'c1', name: 'click', args: {} })
    s = reduce(s, { type: 'tool-result', callId: 'c1', ok: false, error: 'element_not_found' })
    expect(toolItem(s)).toMatchObject({ status: 'failed', error: 'element_not_found' })
  })

  it('moves pre-tool-call text into the trace as reasoning', () => {
    let s = reduce(INITIAL, { type: 'chunk', text: 'I will read the page first.' })
    s = reduce(s, { type: 'tool', callId: 'c1', name: 'readPage', args: {} })
    expect(s.answer).toBe('')
    expect(s.trace[0]).toEqual({ kind: 'reasoning', text: 'I will read the page first.' })
    expect(s.trace[1]).toMatchObject({ kind: 'tool', name: 'readPage', status: 'running' })
  })

  it('folds the finished answer into a turn on done', () => {
    let s = reduce(INITIAL, { type: 'chunk', text: 'Paris.' })
    s = reduce(s, { type: 'done' })
    expect(s.turns).toEqual([{ role: 'assistant', content: 'Paris.' }])
    expect(s.answer).toBe('')
    expect(s.busy).toBe(false)
  })

  it('keeps the reasoning trace on the completed turn after done', () => {
    let s = reduce(INITIAL, { type: 'reasoning', text: 'Let me check the source.' })
    s = reduce(s, { type: 'chunk', text: 'It is legit.' })
    s = reduce(s, { type: 'done' })
    expect(s.trace).toEqual([]) // live area cleared
    expect(s.turns[0]).toMatchObject({ role: 'assistant', content: 'It is legit.' })
    expect(s.turns[0]?.trace?.[0]).toEqual({ kind: 'reasoning', text: 'Let me check the source.' })
  })

  it('collects web-search sources (de-duped) and attaches them on done', () => {
    let s = reduce(INITIAL, { type: 'source', url: 'https://a.com', title: 'A' })
    s = reduce(s, { type: 'source', url: 'https://a.com', title: 'A' }) // dupe ignored
    s = reduce(s, { type: 'source', url: 'https://b.com' })
    expect(s.sources).toHaveLength(2)
    s = reduce(reduce(s, { type: 'chunk', text: 'Answer.' }), { type: 'done' })
    expect(s.sources).toEqual([]) // live area cleared
    expect(s.turns[0]?.sources).toEqual([
      { url: 'https://a.com', title: 'A' },
      { url: 'https://b.com' },
    ])
  })

  it('queues confirmation requests and clears busy on error', () => {
    const s = reduce(INITIAL, { type: 'confirm', id: 'x', tool: 'type', args: {} })
    expect(s.confirms).toHaveLength(1)
    expect(reduce(s, { type: 'error', error: 'boom' })).toMatchObject({
      busy: false,
      error: 'boom',
    })
  })
})
