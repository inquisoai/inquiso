import { z } from 'zod'
import { sendToTab } from '@/core/context/tab'
import { defineTool } from '../context'

export const selectOption = defineTool({
  name: 'selectOption',
  description: 'Choose an option in a <select> (by value or visible label). Needs confirmation.',
  risk: 'medium',
  inputSchema: z.object({ handle: z.string(), value: z.string() }),
  execute: ({ handle, value }, ctx) =>
    sendToTab(ctx.tabId, { type: 'act', args: { action: 'selectOption', handle, text: value } }),
})
