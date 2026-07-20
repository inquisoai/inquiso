import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  API_PERMISSIONS,
  type ApiPermission,
  hasApiPermission,
  setApiPermission,
} from '@/core/auth/api-permissions'
import { hasAllSites, setAllSites } from '@/core/auth/host-permissions'

type State = Record<ApiPermission | 'allSites', boolean>

/** Reads browser.permissions directly (not via the background) — grants are
 * browser state, checked at tool-call time. */
async function readGranted(): Promise<State> {
  const api = await Promise.all(API_PERMISSIONS.map((p) => hasApiPermission(p)))
  const state = { allSites: await hasAllSites() } as State
  API_PERMISSIONS.forEach((p, i) => {
    state[p] = api[i] ?? false
  })
  return state
}

/** Tracks the browser-native optional permissions the agent can use. Grants
 * are browser state (not settings) — this hook only reflects and toggles
 * them; external changes invalidate ['permissions'] (ui/lib/invalidate).
 * Requests need a UI gesture, so they live here. */
export function usePermissions() {
  const client = useQueryClient()

  const { data } = useQuery({ queryKey: ['permissions', 'granted'], queryFn: readGranted })
  const granted = data ?? null

  const invalidate = useCallback(async () => {
    await client.invalidateQueries({ queryKey: ['permissions'] })
    await client.invalidateQueries({ queryKey: ['pageAccess'] })
  }, [client])

  const toggleApi = useCallback(
    async (perm: ApiPermission, grant: boolean) => {
      await setApiPermission(perm, grant)
      await invalidate()
    },
    [invalidate],
  )

  const toggleAllSites = useCallback(
    async (grant: boolean) => {
      await setAllSites(grant)
      await invalidate()
    },
    [invalidate],
  )

  return { granted, toggleApi, toggleAllSites }
}
