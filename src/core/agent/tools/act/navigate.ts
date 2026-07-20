import { z } from 'zod'
import { browser } from '@/platform'
import { defineTool } from '../context'

/** Navigates the active tab. Redirecting the current tab to a URL moves the
 * user off the page they're on, so it always confirms (confirmWhen); back and
 * forward are gated only by risk. */
export const navigate = defineTool({
  name: 'navigate',
  description:
    'Navigate the current tab to a URL, or go back/forward. URL navigation is always confirmed.',
  risk: 'medium',
  inputSchema: z.object({ to: z.union([z.string().url(), z.enum(['back', 'forward'])]) }),
  confirmWhen: ({ to }) => to !== 'back' && to !== 'forward',
  execute: async ({ to }, ctx) => {
    if (to === 'back') await browser.tabs.goBack(ctx.tabId)
    else if (to === 'forward') await browser.tabs.goForward(ctx.tabId)
    else await browser.tabs.update(ctx.tabId, { url: to })
    return { ok: true }
  },
})
