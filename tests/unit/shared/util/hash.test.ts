import { describe, expect, it } from 'vitest'
import { hashString } from '@/shared/util/hash'

describe('hashString', () => {
  it('is deterministic for the same input', () => {
    expect(hashString('hello world')).toBe(hashString('hello world'))
  })

  it('differs for different inputs', () => {
    expect(hashString('a')).not.toBe(hashString('b'))
  })

  it('returns an 8-char hex string', () => {
    expect(hashString('anything')).toMatch(/^[0-9a-f]{8}$/)
  })

  it('handles the empty string', () => {
    expect(hashString('')).toMatch(/^[0-9a-f]{8}$/)
  })
})
