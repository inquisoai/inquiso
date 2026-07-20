import { getCached } from '@/core/data/cache/page-cache'
import type { PageContext } from '@/shared/page'
import { extractTab } from './extract-active'
import { activeTab } from './tab'

/**
 * Resolves the active tab's readable content, served from the hot cache when
 * available (keyed by URL) and extracted on demand otherwise.
 */
export async function getActivePageContext(): Promise<PageContext> {
  const tab = await activeTab()
  if (!tab?.id || !tab.url) throw new Error('no_active_tab')
  const tabId = tab.id
  return getCached(tab.url, () => extractTab(tabId))
}
