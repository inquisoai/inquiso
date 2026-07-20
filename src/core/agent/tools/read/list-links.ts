import { z } from 'zod'
import { sendToTab } from '@/core/context/tab'
import { defineTool } from '../context'

export const listLinks = defineTool({
  name: 'listLinks',
  description: 'List the links on the page (visible text + URL) — useful to plan navigation.',
  risk: 'none',
  inputSchema: z.object({ limit: z.number().int().positive().max(200).optional() }),
  execute: ({ limit }, ctx) => sendToTab(ctx.tabId, { type: 'links', ...(limit ? { limit } : {}) }),
})
