import { browser } from '@/platform'
import type { ContentMsg } from '@/shared/content-actions'

const EXTRACTOR_FILE = '/content-scripts/extractor.js'

/** Injects the content script (idempotent via its own guard) and delivers a
 * typed message to the tab, returning the script's response. An injection
 * blocked by missing activeTab/host permission surfaces as the stable code
 * `page_access_needed`, which the UI pairs with the Grant-access CTA. */
export async function sendToTab<T>(tabId: number, msg: ContentMsg): Promise<T> {
  try {
    await browser.scripting.executeScript({ target: { tabId }, files: [EXTRACTOR_FILE] })
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e)
    if (/cannot access|permission|cannot be scripted/i.test(m)) {
      throw new Error('page_access_needed')
    }
    throw e
  }
  return browser.tabs.sendMessage(tabId, msg) as Promise<T>
}

/** The active tab of the focused window, or undefined when none qualifies —
 * the one place this query lives. */
export async function activeTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
  return tab
}

export async function activeTabId(): Promise<number> {
  const id = (await activeTab())?.id
  if (!id) throw new Error('no_active_tab')
  return id
}

/** The origin of a tab's current URL, or undefined when unreadable — the one
 * place this derivation lives (policy scoping, memory scoping, skills). */
export async function tabOrigin(tabId: number): Promise<string | undefined> {
  try {
    return new URL((await browser.tabs.get(tabId)).url ?? '').origin
  } catch {
    return undefined
  }
}
