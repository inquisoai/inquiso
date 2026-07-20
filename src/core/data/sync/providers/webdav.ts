import type { HistoryExport } from '@/shared/history'
import type { SyncConfig } from '@/shared/sync'
import type { SyncProvider } from '../types'
import { assertOk, requireCfg } from './http'

const auth = (user: string, password: string): string => `Basic ${btoa(`${user}:${password}`)}`

const headers = (cfg: SyncConfig, secret: string): HeadersInit => ({
  Authorization: auth(cfg.webdavUser ?? '', secret),
})

/**
 * WebDAV backup: PUT/GET a single JSON file at the configured URL with basic
 * auth (username in config, app password in the secret store). Works with
 * Nextcloud, ownCloud, and any WebDAV server — no OAuth app to register. The
 * server's origin needs a host-permission grant (requested in the UI).
 */
export const webdav: SyncProvider = {
  id: 'webdav',
  label: 'WebDAV (Nextcloud, ownCloud…)',
  endpoint: (cfg) => cfg.webdavUrl ?? undefined,
  async push(data: HistoryExport, cfg, secret) {
    const res = await fetch(requireCfg(cfg.webdavUrl), {
      method: 'PUT',
      headers: { ...headers(cfg, secret), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    assertOk(res, 'webdav')
  },
  async pull(cfg, secret) {
    const res = await fetch(requireCfg(cfg.webdavUrl), { headers: headers(cfg, secret) })
    if (res.status === 404) return null // nothing backed up yet
    assertOk(res, 'webdav')
    return res.json()
  },
}
