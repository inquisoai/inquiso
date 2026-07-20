import { z } from 'zod'
import { sendToTab } from '@/core/context/tab'
import { defineTool } from '../context'

// Export is `typeText` because `type` is a TS reserved word; the model-facing
// tool name stays 'type'.
export const typeText = defineTool({
  name: 'type',
  description: 'Type text into a field by handle. Needs confirmation.',
  risk: 'medium',
  inputSchema: z.object({ handle: z.string(), text: z.string() }),
  execute: ({ handle, text }, ctx) =>
    sendToTab(ctx.tabId, { type: 'act', args: { action: 'type', handle, text } }),
})
