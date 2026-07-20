import { z } from 'zod'

/**
 * Cloud backup config. Backup writes the conversation export (shared/history)
 * to the user's OWN cloud — never an Inquiso server (docs/adr/0004). Manual by
 * default; auto pushes on a schedule. Restore is always explicit. Secrets (a
 * WebDAV password / OAuth token) live in the background secret store, never
 * here — this config is non-secret and safe to surface to the UI.
 */
export const SYNC_MODES = ['manual', 'auto'] as const
export type SyncMode = (typeof SYNC_MODES)[number]

/** Backup destinations the config can pick. Both need zero OAuth-app
 * registration — the user pastes a credential (WebDAV app password / GitHub
 * token). OAuth providers could slot in behind the same abstraction later. */
export const SYNC_PROVIDERS = ['webdav', 'gist'] as const
export type SyncProviderId = (typeof SYNC_PROVIDERS)[number]

/** The one non-user-configurable sync origin (gist). Single source of truth —
 * the grant request (UI), grant check, grant release, and the API base all
 * derive from it, so they can never drift apart. */
export const GITHUB_API_ORIGIN = 'https://api.github.com'

export const SyncConfig = z.object({
  mode: z.enum(SYNC_MODES),
  /** Selected provider, or null when backup isn't set up. */
  providerId: z.enum(SYNC_PROVIDERS).nullable(),
  /** WebDAV endpoint (the file URL to PUT/GET) and username; non-secret. */
  webdavUrl: z.string().url().optional(),
  webdavUser: z.string().max(200).optional(),
  /** Id of the private gist holding the backup (created at connect). */
  gistId: z.string().optional(),
  /** Epoch ms of the last successful backup. */
  lastBackupAt: z.number().optional(),
})
export type SyncConfig = z.infer<typeof SyncConfig>

export const DEFAULT_SYNC: SyncConfig = { mode: 'manual', providerId: null }

/** Secret-store key holding a provider's credential (WebDAV password / token). */
export const syncSecretKey = (id: SyncProviderId): string => `sync:${id}`

/** What the WebDAV connect form collects (password goes to the secret store). */
export interface WebdavCredentials {
  url: string
  user: string
  password: string
}

/** Last-backup marker, surfaced in the UI. */
export interface SyncStatus {
  connected: boolean
  lastBackupAt?: number
}
