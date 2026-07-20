import { z } from 'zod'
import { browser } from '@/platform'
import { defineTool } from '../context'

/** Brings a tab to the foreground (and focuses its window). Low risk. */
export const activateTab = defineTool({
  name: 'activateTab',
  description: 'Switch to (focus) a tab by its id.',
  risk: 'low',
  inputSchema: z.object({ tabId: z.number().int() }),
  execute: async ({ tabId }) => {
    const tab = await browser.tabs.update(tabId, { active: true })
    if (tab?.windowId !== undefined) await browser.windows.update(tab.windowId, { focused: true })
    return { ok: true }
  },
})
