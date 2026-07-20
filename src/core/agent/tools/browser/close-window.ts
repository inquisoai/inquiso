import { z } from 'zod'
import { browser } from '@/platform'
import { defineTool } from '../context'

/** Closes an entire window and all its tabs. HIGH risk — destroys multiple
 * tabs at once, so it always confirms at every autonomy level. */
export const closeWindow = defineTool({
  name: 'closeWindow',
  description: 'Close a whole browser window and all its tabs (by window id). Always confirmed.',
  risk: 'high',
  inputSchema: z.object({ windowId: z.number().int() }),
  execute: async ({ windowId }) => {
    await browser.windows.remove(windowId)
    return { ok: true }
  },
})
