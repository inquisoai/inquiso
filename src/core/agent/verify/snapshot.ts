import { sendToTab } from '@/core/context/tab'
import { browser } from '@/platform'
import { ElementState } from '@/shared/content-actions'

export interface PageSnapshot {
  url: string
  title: string
}

/** What the verifier compares before/after an action. Either half may be null
 * when unobservable (closed tab, no handle) — classification stays honest. */
export interface ActionSnapshot {
  page: PageSnapshot | null
  element: ElementState | null
}

export async function pageSnapshot(tabId: number): Promise<PageSnapshot | null> {
  try {
    const tab = await browser.tabs.get(tabId)
    return { url: tab.url ?? '', title: tab.title ?? '' }
  } catch {
    return null
  }
}

async function elementSnapshot(tabId: number, handle: string): Promise<ElementState | null> {
  try {
    return ElementState.parse(await sendToTab(tabId, { type: 'state', handle }))
  } catch {
    return null
  }
}

export async function takeSnapshot(tabId: number, handle?: string): Promise<ActionSnapshot> {
  return {
    page: await pageSnapshot(tabId),
    element: handle ? await elementSnapshot(tabId, handle) : null,
  }
}
