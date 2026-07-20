import { z } from 'zod'
import { sendToTab } from '@/core/context/tab'
import { defineTool } from '../context'

/** Draws a citation outline on an element and scrolls it into view. Visual
 * only — low risk, but still an on-page effect so it lives in act/. */
export const highlight = defineTool({
  name: 'highlight',
  description: 'Draw a highlight over an element (by handle) to cite it on the page.',
  risk: 'low',
  inputSchema: z.object({ handle: z.string() }),
  execute: ({ handle }, ctx) =>
    sendToTab(ctx.tabId, { type: 'act', args: { action: 'highlight', handle } }),
})
