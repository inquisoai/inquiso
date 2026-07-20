import { z } from 'zod'
import { sendToTab } from '@/core/context/tab'
import { defineTool } from '../context'

// The confirmation gate is applied by the registry (risk: 'medium'), not here.
export const click = defineTool({
  name: 'click',
  description: 'Click an element by handle. Needs confirmation.',
  risk: 'medium',
  inputSchema: z.object({ handle: z.string() }),
  execute: ({ handle }, ctx) =>
    sendToTab(ctx.tabId, { type: 'act', args: { action: 'click', handle } }),
})
