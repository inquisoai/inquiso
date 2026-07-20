import { z } from 'zod'
import { browser } from '@/platform'
import { defineTool } from '../context'

/** Closes a tab by id. Medium — reversible via reopenClosedTab, but still
 * removes the user's tab, so it's gated (auto-runs only in scope autonomy). */
export const closeTab = defineTool({
  name: 'closeTab',
  description: 'Close a browser tab by its id (from getTabs). Needs confirmation.',
  risk: 'medium',
  inputSchema: z.object({ tabId: z.number().int() }),
  execute: async ({ tabId }) => {
    await browser.tabs.remove(tabId)
    return { ok: true }
  },
})
