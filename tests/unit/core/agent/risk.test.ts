import { describe, expect, it } from 'vitest'
import { needsConfirm } from '@/core/agent/risk'
import { toolDefs } from '@/core/agent/tools/registry'

describe('autonomy gate table', () => {
  it('ask: confirms everything except read-only', () => {
    expect(needsConfirm('readPage', 'ask')).toBe(false)
    expect(needsConfirm('scrollTo', 'ask')).toBe(true) // low
    expect(needsConfirm('click', 'ask')).toBe(true) // medium
    expect(needsConfirm('submitForm', 'ask')).toBe(true) // high
  })

  it('auto-low: runs low, still confirms medium/high', () => {
    expect(needsConfirm('scrollTo', 'auto-low')).toBe(false)
    expect(needsConfirm('click', 'auto-low')).toBe(true)
    expect(needsConfirm('submitForm', 'auto-low')).toBe(true)
  })

  it('scope: runs low+medium, HIGH still confirms (un-overridable floor)', () => {
    expect(needsConfirm('scrollTo', 'scope')).toBe(false)
    expect(needsConfirm('click', 'scope')).toBe(false) // medium auto-runs
    expect(needsConfirm('submitForm', 'scope')).toBe(true) // high floor
    expect(needsConfirm('downloadFile', 'scope')).toBe(true)
  })

  it('unknown tools default to high — always confirm', () => {
    for (const level of ['ask', 'auto-low', 'scope'] as const) {
      expect(needsConfirm('made-up-tool', level)).toBe(true)
    }
  })
})

describe('confirmWhen floor', () => {
  it('forces navigate-to-URL to confirm, but not back/forward', () => {
    const navigate = toolDefs.find((d) => d.name === 'navigate')
    expect(navigate?.confirmWhen?.({ to: 'https://example.com' })).toBe(true)
    expect(navigate?.confirmWhen?.({ to: 'back' })).toBe(false)
  })

  it('forces openTab-with-URL to confirm, but not a blank tab', () => {
    const openTab = toolDefs.find((d) => d.name === 'openTab')
    expect(openTab?.confirmWhen?.({ url: 'https://example.com' })).toBe(true)
    expect(openTab?.confirmWhen?.({ active: true })).toBe(false)
  })
})
