import { GITHUB_API_ORIGIN } from '@/shared/sync'
import type { SyncProvider } from '../types'
import { assertOk, requireCfg } from './http'

const API = `${GITHUB_API_ORIGIN}/gists`
const FILE = 'inquiso-backup.json'
const EMPTY = JSON.stringify({ v: 1, exportedAt: 0, conversations: [] })

const ghHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
})

/**
 * Creates the private backup gist (once, at connect) and returns its id. Also
 * validates the token — a bad token fails here, before anything is stored.
 */
export async function createBackupGist(token: string): Promise<string> {
  const res = await fetch(API, {
    method: 'POST',
    headers: ghHeaders(token),
    body: JSON.stringify({
      description: 'Inquiso chat backup',
      public: false,
      files: { [FILE]: { content: EMPTY } },
    }),
  })
  assertOk(res, 'gist')
  return (await res.json()).id as string
}

/**
 * GitHub Gist backup: a single private gist holds the export JSON. No OAuth app
 * — the user pastes a personal access token with the `gist` scope. Note gist
 * files are truncated at ~1 MB (huge histories should use WebDAV); we follow
 * the raw URL when that happens.
 */
export const gist: SyncProvider = {
  id: 'gist',
  label: 'GitHub Gist (private)',
  endpoint: () => API,
  async push(data, cfg, secret) {
    const res = await fetch(`${API}/${requireCfg(cfg.gistId)}`, {
      method: 'PATCH',
      headers: ghHeaders(secret),
      body: JSON.stringify({ files: { [FILE]: { content: JSON.stringify(data) } } }),
    })
    assertOk(res, 'gist')
  },
  async pull(cfg, secret) {
    const res = await fetch(`${API}/${requireCfg(cfg.gistId)}`, { headers: ghHeaders(secret) })
    if (res.status === 404) return null
    assertOk(res, 'gist')
    const file = (await res.json()).files?.[FILE]
    if (!file) return null
    const text = file.truncated ? await (await fetch(file.raw_url)).text() : file.content
    return text ? JSON.parse(text) : null
  },
}
