import { z } from 'zod'
import { browser } from '@/platform'
import { defineTool } from '../context'

/**
 * Captures what the user currently sees in the active tab as a PNG and hands
 * the image to the model — so a vision-capable model can read charts, canvases,
 * maps, and other image-only UI that the extracted DOM text can't express.
 * Only offered when the active model can see images. Read-only.
 */
export const screenshot = defineTool({
  name: 'screenshot',
  description:
    'Capture the visible area of the active tab as an image the model can see. Use for charts, maps, canvas, or any visual the page text does not describe.',
  risk: 'none',
  inputSchema: z.object({}),
  available: (ctx) => ctx.vision,
  toModelOutput: (output) => {
    const dataUrl = (output as { dataUrl?: string }).dataUrl
    const comma = dataUrl ? dataUrl.indexOf(',') : -1
    if (!dataUrl || comma < 0) {
      return { type: 'content', value: [{ type: 'text', text: 'Screenshot unavailable.' }] }
    }
    return {
      type: 'content',
      value: [{ type: 'image-data', data: dataUrl.slice(comma + 1), mediaType: 'image/png' }],
    }
  },
  execute: async () => {
    const dataUrl = await browser.tabs.captureVisibleTab({ format: 'png' })
    return { dataUrl }
  },
})
