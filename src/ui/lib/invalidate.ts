import type { QueryClient } from '@tanstack/react-query'
import { browser } from '@/platform'

/**
 * Browser events → query invalidation, wired once per UI context. The
 * background never pushes "data changed" messages (mutations invalidate
 * their own keys), so the only external writers are the browser itself:
 * tab switches change what "the current page" means, and permission
 * changes flip page access.
 */
export function wireInvalidation(client: QueryClient): void {
  const tabsChanged = () => {
    void client.invalidateQueries({ queryKey: ['pageAccess'] })
    void client.invalidateQueries({ queryKey: ['scopeTabs'] })
  }
  const permissionsChanged = () => {
    void client.invalidateQueries({ queryKey: ['pageAccess'] })
    void client.invalidateQueries({ queryKey: ['permissions'] })
    void client.invalidateQueries({ queryKey: ['voiceReady'] })
  }
  browser.tabs?.onActivated.addListener(tabsChanged)
  browser.tabs?.onUpdated.addListener(tabsChanged)
  browser.permissions?.onAdded?.addListener(permissionsChanged)
  browser.permissions?.onRemoved?.addListener(permissionsChanged)
}
