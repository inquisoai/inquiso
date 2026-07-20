import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { requestHostPermission } from '@/core/auth/host-permissions'
import type { PageAccess } from '@/core/context/access'
import { sendToBackground } from '@/ui/lib/messaging'

/**
 * Live readability of the current page. Tab switches, in-tab navigations, and
 * permission grants/revocations invalidate ['pageAccess'] (ui/lib/invalidate),
 * so the "grant access" CTA appears the moment the user lands on a blocked
 * site and disappears the moment access exists, without reopening the panel.
 */
export function usePageAccess() {
  const client = useQueryClient()

  const { data } = useQuery({
    queryKey: ['pageAccess'],
    queryFn: (): Promise<PageAccess | null> =>
      sendToBackground<PageAccess>({ type: 'pageAccess' }).catch(() => null),
  })
  const access = data ?? null

  const refresh = useCallback(async (): Promise<void> => {
    await client.invalidateQueries({ queryKey: ['pageAccess'] })
  }, [client])

  /** Grants the site (needs this click's user gesture), then re-probes. */
  const grant = useCallback(async (): Promise<boolean> => {
    if (!access?.url) return false
    const ok = await requestHostPermission(access.url)
    if (ok) await client.invalidateQueries({ queryKey: ['pageAccess'] })
    return ok
  }, [access, client])

  return { access, grant, refresh }
}
