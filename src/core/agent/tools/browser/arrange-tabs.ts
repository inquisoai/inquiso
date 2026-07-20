import { z } from 'zod'
import { browser } from '@/platform'
import { defineTool } from '../context'

/** Reorders tabs by moving them to new indices. Low risk — positional only. */
export const arrangeTabs = defineTool({
  name: 'arrangeTabs',
  description: 'Reorder tabs: move each given tab to a new index in its window.',
  risk: 'low',
  inputSchema: z.object({
    moves: z.array(z.object({ tabId: z.number().int(), index: z.number().int() })).max(50),
  }),
  execute: async ({ moves }) => {
    for (const { tabId, index } of moves) await browser.tabs.move(tabId, { index })
    return { ok: true }
  },
})
