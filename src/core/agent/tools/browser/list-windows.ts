import { z } from 'zod'
import { tabSummary, webTabs } from '@/core/context/scope'
import { browser } from '@/platform'
import { defineTool } from '../context'

/** Lists open windows and their web tabs, so the agent can reason across
 * windows before acting. Read-only. */
export const listWindows = defineTool({
  name: 'listWindows',
  description: 'List open browser windows with their tabs (id, title, URL).',
  risk: 'none',
  inputSchema: z.object({}),
  execute: async () => {
    const wins = await browser.windows.getAll({ populate: true })
    return {
      windows: wins.map((w) => ({
        id: w.id,
        focused: w.focused,
        tabs: webTabs(w.tabs ?? []).map(tabSummary),
      })),
    }
  },
})
