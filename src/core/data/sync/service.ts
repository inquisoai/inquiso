import { requireHostPermission } from '@/core/auth/host-permissions'
import { getKey } from '@/core/auth/secret-store'
import { exportHistory, importHistory } from '@/core/data/history/transfer'
import { getSyncConfig, setSyncConfig } from '@/core/data/settings/store'
import { type SyncStatus, syncSecretKey } from '@/shared/sync'
import { getSyncProvider } from './registry'

/** Resolves the connected provider + its credential, or throws if backup isn't
 * set up or the endpoint's origin grant is gone. The secret is read here in
 * the background, never exposed to the UI. */
async function active() {
  const cfg = await getSyncConfig()
  const provider = cfg.providerId ? getSyncProvider(cfg.providerId) : undefined
  if (!cfg.providerId || !provider) throw new Error('sync_not_connected')
  const url = provider.endpoint(cfg)
  if (url) await requireHostPermission(url)
  const secret = (await getKey(syncSecretKey(cfg.providerId))) ?? ''
  return { cfg, provider, secret }
}

/** Pushes the current conversation export to the user's cloud. */
export async function syncBackup(): Promise<SyncStatus> {
  const { cfg, provider, secret } = await active()
  await provider.push(await exportHistory(), cfg, secret)
  const at = Date.now()
  await setSyncConfig({ lastBackupAt: at })
  return { connected: true, lastBackupAt: at }
}

/** Pulls the cloud backup and imports it (adds chats; never overwrites). */
export async function syncRestore(): Promise<{ imported: number }> {
  const { cfg, provider, secret } = await active()
  const data = await provider.pull(cfg, secret)
  return data ? importHistory(data) : { imported: 0 }
}
