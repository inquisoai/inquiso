import { z } from 'zod'
import { guardPermission } from '@/core/auth/api-permissions'
import { browser } from '@/platform'
import { defineTool } from '../context'

/** Searches the user's browsing history (needs the history permission — a
 * privacy-sensitive grant, so it's off until the user allows it). Read-only. */
export const searchHistory = defineTool({
  name: 'searchHistory',
  description: 'Search browsing history by text (needs the history permission).',
  risk: 'none',
  inputSchema: z.object({
    query: z.string(),
    maxResults: z.number().int().positive().max(100).optional(),
  }),
  execute: async ({ query, maxResults }) => {
    const denied = await guardPermission('history')
    if (denied) return denied
    const items = await browser.history.search({
      text: query,
      maxResults: maxResults ?? 20,
      startTime: 0,
    })
    return {
      history: items.map((h) => ({ title: h.title ?? '', url: h.url ?? '', visits: h.visitCount })),
    }
  },
})
