import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requestHostPermission } from '@/core/auth/host-permissions'
import type { Autonomy } from '@/shared/autonomy'
import type { AppConfig } from '@/shared/config'
import { GITHUB_API_ORIGIN, type SyncMode, type SyncStatus } from '@/shared/sync'
import { sendToBackground } from '@/ui/lib/messaging'

type Msg = Parameters<typeof sendToBackground>[0]

/** Loads app config from the background and exposes setting mutations. The UI
 * never sees raw keys — only `keyStatus` (present / absent). All consumers
 * share one cached ['config'] entry; every mutation invalidates it. */
export function useConfig() {
  const client = useQueryClient()
  const { data: config = null } = useQuery({
    queryKey: ['config'],
    queryFn: () => sendToBackground<AppConfig>({ type: 'getConfig' }),
  })
  const { mutateAsync } = useMutation({
    mutationFn: (msg: Msg) => sendToBackground(msg),
    onSettled: () => client.invalidateQueries({ queryKey: ['config'] }),
  })
  const mutate = async (msg: Msg) => {
    await mutateAsync(msg)
  }

  /** Grants a host permission (needs a user gesture, so it runs here in the
   * UI), then persists the record. Returns false if the user declines. */
  const withGrant = async (origin: string, msg: Msg) => {
    if (!(await requestHostPermission(origin))) return false
    await mutate(msg)
    return true
  }

  return {
    config,
    setProvider: (providerId: string) => mutate({ type: 'setProvider', providerId }),
    setModel: (provider: string, modelId: string) =>
      mutate({ type: 'setModel', provider, modelId }),
    saveKey: (provider: string, apiKey: string) => mutate({ type: 'setApiKey', provider, apiKey }),
    removeKey: (provider: string) => mutate({ type: 'removeApiKey', provider }),
    clearCache: () => sendToBackground({ type: 'clearCache' }),
    clearAttachments: () => sendToBackground({ type: 'clearAttachments' }),
    addProvider: (spec: { label: string; baseURL: string; model: string; requiresKey: boolean }) =>
      withGrant(spec.baseURL, { type: 'addProvider', ...spec }),
    removeProvider: (id: string) => mutate({ type: 'removeProvider', id }),
    addMcp: (spec: { label: string; url: string; token?: string }) =>
      withGrant(spec.url, {
        type: 'addMcp',
        label: spec.label,
        url: spec.url,
        ...(spec.token ? { token: spec.token } : {}),
      }),
    removeMcp: (id: string) => mutate({ type: 'removeMcp', id }),
    setSyncMode: (mode: SyncMode) => mutate({ type: 'setSyncMode', mode }),
    connectWebdav: (s: { url: string; user: string; password: string }) =>
      withGrant(s.url, { type: 'connectWebdav', ...s }),
    connectGist: (token: string) => withGrant(GITHUB_API_ORIGIN, { type: 'connectGist', token }),
    disconnectSync: () => mutate({ type: 'disconnectSync' }),
    backup: async (): Promise<SyncStatus> => {
      const status = await sendToBackground<SyncStatus>({ type: 'syncBackup' })
      await client.invalidateQueries({ queryKey: ['config'] })
      return status
    },
    restore: async () => {
      const result = await sendToBackground<{ imported: number }>({ type: 'syncRestore' })
      await client.invalidateQueries({ queryKey: ['history'] })
      return result
    },
    setReasoning: (enabled: boolean) => mutate({ type: 'setReasoning', enabled }),
    setWebSearch: (enabled: boolean) => mutate({ type: 'setWebSearch', enabled }),
    setAutonomy: (autonomy: Autonomy) => mutate({ type: 'setAutonomy', autonomy }),
  }
}
