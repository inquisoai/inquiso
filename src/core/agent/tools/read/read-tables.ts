import { z } from 'zod'
import { sendToTab } from '@/core/context/tab'
import { defineTool } from '../context'

export const readTables = defineTool({
  name: 'readTables',
  description: 'Extract the page tables as rows of cells — for structured data (prices, specs).',
  risk: 'none',
  inputSchema: z.object({ limit: z.number().int().positive().max(20).optional() }),
  execute: ({ limit }, ctx) =>
    sendToTab(ctx.tabId, { type: 'tables', ...(limit ? { limit } : {}) }),
})
