import { z } from 'zod'
import { extractTab } from '@/core/context/extract-active'
import { defineTool } from '../context'

/** Reads another open tab's content (by id from getTabs). Injects the extractor
 * on demand, which may require a per-host permission the user has granted. */
export const readTab = defineTool({
  name: 'readTab',
  description: 'Read another open tab as Markdown, by its id (from getTabs).',
  risk: 'none',
  inputSchema: z.object({ tabId: z.number().int() }),
  execute: async ({ tabId }) => {
    try {
      return await extractTab(tabId)
    } catch {
      return { ok: false, error: 'tab_unreadable' }
    }
  },
})
