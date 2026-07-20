import { z } from 'zod'
import { browser } from '@/platform'
import { defineTool } from '../context'

/** Downloads a file (PDF, image, media) from a URL found on the page to the
 * user's downloads. Gated: the user sees and approves the exact URL. The
 * browser fetches it directly — no page data is sent. */
export const downloadFile = defineTool({
  name: 'downloadFile',
  description:
    'Download a file (PDF, image, media) from a URL on the page to the user’s downloads. ' +
    'Pass a URL from listLinks/readPage. Always confirmed.',
  risk: 'high',
  inputSchema: z.object({ url: z.string().url(), filename: z.string().max(120).optional() }),
  execute: async ({ url, filename }) => {
    // biome-ignore lint/suspicious/noExplicitAny: downloads is optional in the polyfill types.
    const api = browser as any
    const id = await api.downloads.download({ url, ...(filename ? { filename } : {}) })
    // The browser accepting the download (an id) is the outcome evidence —
    // runPlain turns this into an OutcomeVerified ledger event.
    return {
      ok: true,
      downloadId: id,
      evidence: [{ type: 'download_started', ...(filename ? { filename } : {}) }],
    }
  },
})
