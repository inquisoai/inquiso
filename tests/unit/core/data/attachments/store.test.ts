import { describe, expect, it } from 'vitest'
import { dataUrlToBlob } from '@/core/data/attachments/store'

describe('dataUrlToBlob', () => {
  it('decodes a base64 data URL to a Blob with the right type and bytes', async () => {
    const blob = dataUrlToBlob(`data:text/plain;base64,${btoa('hello')}`)
    expect(blob.type).toBe('text/plain')
    expect(await blob.text()).toBe('hello')
  })

  it('stores raw bytes (no base64 inflation) — 4 base64 chars → 3 bytes', () => {
    expect(dataUrlToBlob('data:application/octet-stream;base64,AAAA').size).toBe(3)
  })

  it('falls back to octet-stream when the media type is absent', () => {
    expect(dataUrlToBlob(`data:;base64,${btoa('x')}`).type).toBe('application/octet-stream')
  })
})
