import type { HistoryExport } from '@/shared/history'
import type { SyncConfig, SyncProviderId } from '@/shared/sync'

/**
 * A cloud-backup destination. Each provider only moves an opaque JSON blob (the
 * conversation export) to/from the user's own storage — it never sees model
 * keys or page data. `secret` is the provider credential, fetched from the
 * background secret store by the service (never passed through the UI).
 */
export interface SyncProvider {
  id: SyncProviderId
  label: string
  /** The URL this provider fetches, so the service can verify its origin grant
   * before any request leaves the extension. Undefined = not configured yet. */
  endpoint: (cfg: SyncConfig) => string | undefined
  /** Upload the export, overwriting the remote copy. */
  push: (data: HistoryExport, cfg: SyncConfig, secret: string) => Promise<void>
  /** Download the remote export, or null if none exists yet. Returns raw JSON;
   * the service validates it before importing. */
  pull: (cfg: SyncConfig, secret: string) => Promise<unknown | null>
}
