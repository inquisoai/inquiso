import { useQuery } from '@tanstack/react-query'
import type { Scope } from '@/shared/constants'
import type { TabInfo } from '@/shared/page'
import { sendToBackground } from '@/ui/lib/messaging'

const NO_TABS: TabInfo[] = []

/** The exact pages that will be shared for the current scope, kept live as the
 * user switches or navigates tabs (['scopeTabs'] is invalidated by
 * ui/lib/invalidate) — so the preview never goes stale. Backed by the same
 * resolveScopeTabs the background uses to gather context. */
export function useScopeTabs(scope: Scope): TabInfo[] {
  const { data } = useQuery({
    queryKey: ['scopeTabs', scope],
    queryFn: () => sendToBackground<TabInfo[]>({ type: 'scopeTabs', scope }),
  })
  return data ?? NO_TABS
}
