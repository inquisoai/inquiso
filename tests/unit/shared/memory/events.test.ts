import { describe, expect, it } from 'vitest'
import { LedgerEvent, toPageRef } from '@/shared/memory/events'

const base = {
  id: 'evt_1',
  taskId: 'task_1',
  runId: 'run_1',
  seq: 1,
  at: 1_700_000_000_000,
  actor: 'agent',
  type: 'ActionStarted',
}

describe('ledger event schema', () => {
  it('accepts a minimal event and defaults the payload', () => {
    const e = LedgerEvent.parse(base)
    expect(e.payload).toEqual({})
  })

  it('rejects unknown event types and actors (boundary validation)', () => {
    expect(LedgerEvent.safeParse({ ...base, type: 'SomethingElse' }).success).toBe(false)
    expect(LedgerEvent.safeParse({ ...base, actor: 'website' }).success).toBe(false)
  })

  it('validates evidence entries against the typed union', () => {
    const ok = LedgerEvent.safeParse({
      ...base,
      evidence: [{ type: 'url_changed', from: 'https://a.test/', to: 'https://a.test/b' }],
    })
    expect(ok.success).toBe(true)
    const bad = LedgerEvent.safeParse({ ...base, evidence: [{ type: 'vibes', good: true }] })
    expect(bad.success).toBe(false)
  })

  it('toPageRef derives the origin and survives invalid urls', () => {
    expect(toPageRef('https://a.test/x?y=1', 'T')).toEqual({
      url: 'https://a.test/x?y=1',
      title: 'T',
      origin: 'https://a.test',
    })
    expect(toPageRef('not a url')).toEqual({ url: 'not a url' })
  })
})
