import { z } from 'zod'
import { browser } from '@/platform'
import { defineTool } from '../context'

/** Opens a new browser window, optionally with URLs and/or incognito. Low
 * risk — additive, easily closed. */
export const newWindow = defineTool({
  name: 'newWindow',
  description: 'Open a new browser window, optionally with URLs and/or in incognito mode.',
  risk: 'low',
  inputSchema: z.object({
    urls: z.array(z.string().url()).max(20).optional(),
    incognito: z.boolean().optional(),
  }),
  execute: async ({ urls, incognito }) => {
    const win = await browser.windows.create({
      ...(urls ? { url: urls } : {}),
      ...(incognito ? { incognito } : {}),
    })
    return { ok: true, windowId: win?.id }
  },
})
