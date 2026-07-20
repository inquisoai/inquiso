import { browser } from '@/platform'
import type { Scope } from '@/shared/constants'
import { activeTab } from './tab'

export const isWebUrl = (url?: string): boolean => !!url && /^https?:/.test(url)
export const webTabs = <T extends { url?: string | undefined }>(tabs: T[]): T[] =>
  tabs.filter((t) => isWebUrl(t.url))

/** The projection of a tab that tools expose to the model. */
export const tabSummary = (t: {
  id?: number | undefined
  title?: string | undefined
  url?: string | undefined
}) => ({ id: t.id, title: t.title ?? '', url: t.url ?? '' })

/** groupId is Chromium-only and absent from the polyfill's Tab type. */
const groupOf = (tab: unknown): number | undefined => (tab as { groupId?: number }).groupId

/**
 * Resolves the tabs in scope. Restricted (chrome://, extension) pages are
 * excluded. Firefox has no tab groups, so 'group' falls back to the window.
 */
export async function resolveScopeTabs(scope: Scope) {
  if (scope === 'window') return webTabs(await browser.tabs.query({ currentWindow: true }))

  const active = await activeTab()
  if (scope === 'page') return active && isWebUrl(active.url) ? [active] : []

  const all = webTabs(await browser.tabs.query({ currentWindow: true }))
  const groupId = active ? groupOf(active) : undefined
  if (groupId === undefined || groupId < 0) return all
  return all.filter((tab) => groupOf(tab) === groupId)
}
