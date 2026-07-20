import { describe, expect, it } from 'vitest'
import { getDef, providerInfos } from '@/core/providers/registry'

describe('provider registry', () => {
  it('lists the on-device default first, then the cloud providers', () => {
    expect(providerInfos[0]?.id).toBe('chrome-ai')
    const ids = providerInfos.map((p) => p.id)
    expect(ids).toContain('openai')
    expect(ids).toContain('anthropic')
    expect(ids).toContain('google')
  })

  it('strips the non-serializable model factory from UI metadata', () => {
    for (const info of providerInfos) {
      expect(Object.hasOwn(info, 'makeModel')).toBe(false)
      expect(info.dataUse.length).toBeGreaterThan(0)
    }
  })

  it('resolves every provider by id under the one convention', () => {
    expect(getDef('openai')?.id).toBe('openai')
    expect(getDef('chrome-ai')?.id).toBe('chrome-ai')
    expect(getDef('chrome-ai')?.availability).toBeDefined()
    expect(getDef('nope')).toBeUndefined()
  })
})
