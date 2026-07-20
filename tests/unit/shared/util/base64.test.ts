import { describe, expect, it } from 'vitest'
import { fromBase64, toBase64 } from '@/shared/util/base64'

describe('base64', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 128, 255])
    expect(Array.from(fromBase64(toBase64(bytes)))).toEqual(Array.from(bytes))
  })

  it('encodes a known value', () => {
    expect(toBase64(new TextEncoder().encode('hi'))).toBe('aGk=')
  })

  it('round-trips the empty input', () => {
    expect(toBase64(new Uint8Array([]))).toBe('')
    expect(fromBase64('').length).toBe(0)
  })
})
