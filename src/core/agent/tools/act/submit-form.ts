import { z } from 'zod'
import { sendToTab } from '@/core/context/tab'
import { defineTool } from '../context'

// High risk: submitting sends data. Always confirmed by the registry.
export const submitForm = defineTool({
  name: 'submitForm',
  description: 'Submit the form containing an element (by handle). Sends data. Always confirmed.',
  risk: 'high',
  inputSchema: z.object({ handle: z.string() }),
  execute: ({ handle }, ctx) =>
    sendToTab(ctx.tabId, { type: 'act', args: { action: 'submit', handle } }),
})
