import { browser } from 'wxt/browser'

/**
 * The ONLY place where cross-browser API differences are branched on.
 * Everything else imports these helpers. See docs/07-project-structure.md.
 */

export const isFirefox = import.meta.env.BROWSER === 'firefox'

/** Whether the Chromium side panel API is available (vs Firefox sidebar). */
export const hasSidePanel = (): boolean =>
  // biome-ignore lint/suspicious/noExplicitAny: feature-detecting a non-typed API.
  typeof (browser as any).sidePanel !== 'undefined'

/** Open the AI sidebar for the given window, using whichever API exists. */
export async function openSidebar(windowId: number): Promise<void> {
  // biome-ignore lint/suspicious/noExplicitAny: APIs diverge across browsers.
  const api = browser as any
  if (hasSidePanel()) {
    await api.sidePanel.open({ windowId })
  } else if (api.sidebarAction) {
    await api.sidebarAction.toggle()
  }
}

/** Wire a handler to the toolbar-button click. The namespace differs by
 * manifest version — `action` on MV3 (Chromium), `browserAction` on Firefox
 * MV2 — and touching the missing one throws, so resolve it here. */
export function onActionClick(handler: (windowId: number | undefined) => void): void {
  // biome-ignore lint/suspicious/noExplicitAny: action vs browserAction across MV3/MV2.
  const api = browser as any
  const action = api.action ?? api.browserAction
  action?.onClicked.addListener((tab: { windowId?: number }) => handler(tab.windowId))
}

export { browser }
