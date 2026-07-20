import { sendToTab } from '@/core/context/tab'
import { QueryArgs } from '@/shared/content-actions'
import { defineTool } from '../context'

export const queryElements = defineTool({
  name: 'queryElements',
  description: 'Find interactive elements by role, visible text, or CSS selector. Returns handles.',
  risk: 'none',
  inputSchema: QueryArgs,
  execute: (args, ctx) => sendToTab(ctx.tabId, { type: 'query', args }),
})
