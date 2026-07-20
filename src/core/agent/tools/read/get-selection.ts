import { z } from 'zod'
import { sendToTab } from '@/core/context/tab'
import { defineTool } from '../context'

export const getSelection = defineTool({
  name: 'getSelection',
  description: "Read the text the user has selected on the page (for 'explain this').",
  risk: 'none',
  inputSchema: z.object({}),
  execute: (_args, ctx) => sendToTab(ctx.tabId, { type: 'getSelection' }),
})
