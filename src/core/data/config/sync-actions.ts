import { requireHostPermission } from '@/core/auth/host-permissions'
import { removeKey, setKey } from '@/core/auth/secret-store'
import { getSyncConfig, setSyncConfig } from '@/core/data/settings/store'
import { createBackupGist } from '@/core/data/sync/providers/gist'
import { getSyncProvider } from '@/core/data/sync/registry'
import { rescheduleSync } from '@/core/data/sync/schedule'
import { GITHUB_API_ORIGIN, type SyncMode, syncSecretKey } from '@/shared/sync'
import { releaseOriginGrant } from './grants'

/** UI-facing cloud-backup mutations (background-only). Kept apart from the model
 * config so config/service stays small and to avoid a service↔schedule cycle. */
export async function setSyncMode(mode: SyncMode): Promise<void> {
  await setSyncConfig({ mode })
  await rescheduleSync()
}

/** Stores the WebDAV app password encrypted, saves the non-secret URL/user.
 * The origin grant is verified here in the background — connecting without it
 * fails loudly instead of at the first backup (docs/05 T5). */
export async function connectWebdav(url: string, user: string, password: string): Promise<void> {
  await requireHostPermission(url)
  await setKey(syncSecretKey('webdav'), password)
  await setSyncConfig({ providerId: 'webdav', webdavUrl: url, webdavUser: user })
  await rescheduleSync()
}

/** Connects GitHub Gist: validates the token by creating the private backup
 * gist, then stores the token encrypted and the gist id (non-secret). */
export async function connectGist(token: string): Promise<void> {
  await requireHostPermission(GITHUB_API_ORIGIN)
  const gistId = await createBackupGist(token)
  await setKey(syncSecretKey('gist'), token)
  await setSyncConfig({ providerId: 'gist', gistId })
  await rescheduleSync()
}

/** Disconnects whichever provider is active, clearing its stored credential
 * and releasing the endpoint's origin grant. */
export async function disconnectSync(): Promise<void> {
  const cfg = await getSyncConfig()
  if (cfg.providerId) await removeKey(syncSecretKey(cfg.providerId))
  const url = cfg.providerId ? getSyncProvider(cfg.providerId)?.endpoint(cfg) : undefined
  await setSyncConfig({ providerId: null })
  await rescheduleSync()
  if (url) await releaseOriginGrant(url)
}
