import { describe, expect, it } from 'vitest'
import { instructionsFor } from '@/core/agent/loop/cache'

describe('instructionsFor', () => {
  it('marks a cache breakpoint only for Anthropic', () => {
    const msg = instructionsFor('SYSTEM', 'anthropic')
    expect(typeof msg).not.toBe('string')
    if (typeof msg === 'string') return
    expect(msg.role).toBe('system')
    expect(msg.content).toBe('SYSTEM')
    // biome-ignore lint/suspicious/noExplicitAny: reading nested providerOptions in a test.
    const opts = (msg as any)?.providerOptions?.anthropic?.cacheControl
    expect(opts).toEqual({ type: 'ephemeral' })
  })

  it('returns the plain string for providers that cache automatically / have no cache', () => {
    for (const id of ['openai', 'google', 'chrome-ai', 'some-custom']) {
      expect(instructionsFor('SYSTEM', id)).toBe('SYSTEM')
    }
  })
})
