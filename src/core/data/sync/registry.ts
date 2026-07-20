import type { SyncProviderId } from '@/shared/sync'
import { gist } from './providers/gist'
import { webdav } from './providers/webdav'
import type { SyncProvider } from './types'

/** Every backup provider, one convention. Add an adapter here (implementing
 * SyncProvider) and expose its id in shared/sync SYNC_PROVIDERS — the config
 * picker and service pick it up with no further wiring. Both current providers
 * need zero OAuth-app registration (credential paste). */
export const syncProviders: SyncProvider[] = [webdav, gist]

export const getSyncProvider = (id: SyncProviderId): SyncProvider | undefined =>
  syncProviders.find((p) => p.id === id)
