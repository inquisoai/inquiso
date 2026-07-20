import { z } from 'zod'
import { sendToTab } from '@/core/context/tab'
import { defineTool } from '../context'

export const waitFor = defineTool({
  name: 'waitFor',
  description:
    'Wait until a CSS selector appears (e.g. after navigating or a click loads content).',
  risk: 'low',
  inputSchema: z.object({
    selector: z.string(),
    timeoutMs: z.number().int().positive().max(30_000).optional(),
  }),
  execute: ({ selector, timeoutMs }, ctx) =>
    sendToTab(ctx.tabId, { type: 'waitFor', selector, ...(timeoutMs ? { timeoutMs } : {}) }),
})
