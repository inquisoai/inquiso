import { describe, expect, it } from 'vitest'
import type { ToolContext } from '@/core/agent/tools/context'
import { screenshot } from '@/core/agent/tools/read/screenshot'

const ctx = (vision: boolean) => ({ vision }) as unknown as ToolContext

describe('screenshot vision tool', () => {
  it('is offered only when the model can see images', () => {
    expect(screenshot.available?.(ctx(true))).toBe(true)
    expect(screenshot.available?.(ctx(false))).toBe(false)
  })

  it('maps a data URL into an image the model sees, stripping the prefix', () => {
    const out = screenshot.toModelOutput?.({ dataUrl: 'data:image/png;base64,AAAB' })
    expect(out).toEqual({
      type: 'content',
      value: [{ type: 'image-data', data: 'AAAB', mediaType: 'image/png' }],
    })
  })

  it('degrades to text when no image was captured', () => {
    const out = screenshot.toModelOutput?.({})
    expect(out?.value[0]?.type).toBe('text')
  })
})
