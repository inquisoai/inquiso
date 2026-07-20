import { z } from 'zod'
import { sendToTab } from '@/core/context/tab'
import { defineTool } from '../context'

export const scrollTo = defineTool({
  name: 'scrollTo',
  description: 'Scroll an element (by handle) into view.',
  risk: 'low',
  inputSchema: z.object({ handle: z.string() }),
  execute: ({ handle }, ctx) =>
    sendToTab(ctx.tabId, { type: 'act', args: { action: 'scrollTo', handle } }),
})
