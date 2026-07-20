import { PageContext } from '@/shared/page'
import { sendToTab } from './tab'

/**
 * Injects the extractor (idempotent) and asks it for the readable content.
 * On-demand injection honors least privilege — no standing all-URLs content
 * script (docs/05-security.md T4). Multi-tab scope arrives in M4.
 */
export async function extractTab(tabId: number): Promise<PageContext> {
  return PageContext.parse(await sendToTab(tabId, { type: 'extract' }))
}
