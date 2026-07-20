import { describe, expect, it } from 'vitest'
import { createRouter } from '@/core/messaging/router'
import { PROTOCOL_VERSION } from '@/shared/constants'

describe('messaging router', () => {
  const router = createRouter({
    ping: async () => 'pong',
    getPageContext: async () => ({ url: 'https://x.com', title: 't', text: '', extractedAt: 0 }),
  })

  it('dispatches a valid request', async () => {
    const res = await router({ v: PROTOCOL_VERSION, type: 'ping' })
    expect(res).toEqual({ ok: true, data: 'pong' })
  })

  it('rejects a malformed message', async () => {
    const res = await router({ type: 'nope' })
    expect(res.ok).toBe(false)
    expect(res.error).toBe('invalid_message')
  })

  it('rejects a wrong protocol version', async () => {
    const res = await router({ v: 999, type: 'ping' })
    expect(res.ok).toBe(false)
  })
})
