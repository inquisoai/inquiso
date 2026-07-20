import { z } from 'zod'
import { browser } from '@/platform'
import { defineTool } from '../context'

/** Opens a new tab (optionally at a URL, optionally focused). A blank tab is
 * harmless (low risk), but opening a URL is an outbound request the model
 * chose — an injected page could exfiltrate data via query params or surface a
 * phishing page — so it always confirms, same floor as navigate. */
export const openTab = defineTool({
  name: 'openTab',
  description:
    'Open a new browser tab, optionally at a URL and optionally focused. Opening a URL is always confirmed.',
  risk: 'low',
  inputSchema: z.object({
    url: z.string().url().optional(),
    active: z.boolean().optional(),
  }),
  confirmWhen: ({ url }) => url !== undefined,
  execute: async ({ url, active }) => {
    const tab = await browser.tabs.create({ ...(url ? { url } : {}), active: active ?? true })
    return { ok: true, tabId: tab.id }
  },
})
