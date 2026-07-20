import { browser } from '@/platform'
import { activeTab } from './tab'

export interface PageAccess {
  /** Whether the page's content can be read right now. */
  readable: boolean
  /** Origin to request a grant for when it can't (absent on non-web pages). */
  origin?: string
  url?: string
}

const originOf = (url: string): string | undefined => {
  try {
    return new URL(url).origin
  } catch {
    return undefined
  }
}

/**
 * Ground-truth access check for the active tab: a no-op script injection
 * succeeds only with an activeTab grant or a standing host permission.
 * Drives the "Grant access to this site" CTA — a permission error should be
 * a one-click fix, not a dead-end sentence from the model (docs/adr/0003).
 */
export async function activePageAccess(): Promise<PageAccess> {
  const tab = await activeTab()
  const url = tab?.url ?? ''
  if (!tab?.id || !/^https?:/.test(url)) return { readable: false }
  const origin = originOf(url)
  try {
    await browser.scripting.executeScript({ target: { tabId: tab.id }, func: () => true })
    return { readable: true, ...(origin ? { origin } : {}), url }
  } catch {
    return { readable: false, ...(origin ? { origin } : {}), url }
  }
}
