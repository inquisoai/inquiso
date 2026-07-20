import { z } from 'zod'
import { tabSummary, webTabs } from '@/core/context/scope'
import { browser } from '@/platform'
import { defineTool } from '../context'

/** Lists the open web tabs (id/title/URL) so the agent can reason across tabs
 * and pick one to read with readTab. */
export const getTabs = defineTool({
  name: 'getTabs',
  description: 'List the open web tabs in this window (id, title, URL) for cross-tab work.',
  risk: 'none',
  inputSchema: z.object({}),
  execute: async () => {
    const tabs = await browser.tabs.query({ currentWindow: true })
    return { tabs: webTabs(tabs).map(tabSummary) }
  },
})
