import { z } from 'zod'
import { browser } from '@/platform'
import { toBase64 } from '@/shared/util/base64'
import { defineTool } from '../context'

/** Saves agent output (extracted data, a summary) to the user's downloads.
 * Writing a file to disk is irreversible from the user's point of view, so it
 * always confirms — same floor as downloadFile (docs/05 gate table: download = high). */
export const exportData = defineTool({
  name: 'exportData',
  description: 'Save text/JSON/CSV content as a file download. Always confirmed.',
  risk: 'high',
  inputSchema: z.object({
    filename: z.string().min(1).max(120),
    content: z.string(),
    mimeType: z.string().default('text/plain'),
  }),
  execute: async ({ filename, content, mimeType }) => {
    const url = `data:${mimeType};base64,${toBase64(new TextEncoder().encode(content))}`
    // biome-ignore lint/suspicious/noExplicitAny: downloads is optional in the polyfill types.
    const api = browser as any
    await api.downloads.download({ url, filename, saveAs: false })
    return {
      ok: true,
      filename,
      evidence: [{ type: 'download_started', filename, mimeType }],
    }
  },
})
