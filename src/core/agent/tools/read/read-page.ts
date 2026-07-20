import { z } from 'zod'
import { sendToTab } from '@/core/context/tab'
import { defineTool } from '../context'

export const readPage = defineTool({
  name: 'readPage',
  description: 'Read the current page as Markdown.',
  risk: 'none',
  inputSchema: z.object({}),
  execute: (_args, ctx) => sendToTab(ctx.tabId, { type: 'extract' }),
})
