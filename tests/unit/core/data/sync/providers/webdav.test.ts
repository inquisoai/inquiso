import { afterEach, describe, expect, it, vi } from 'vitest'
import { webdav } from '@/core/data/sync/providers/webdav'
import type { SyncConfig } from '@/shared/sync'

const cfg: SyncConfig = {
  mode: 'manual',
  providerId: 'webdav',
  webdavUrl: 'https://dav.example.com/inquiso.json',
  webdavUser: 'me',
}
const data = { v: 1 as const, exportedAt: 1, conversations: [] }

afterEach(() => vi.unstubAllGlobals())

describe('webdav provider', () => {
  it('PUTs the export with basic auth', async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init: RequestInit) => new Response(null, { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await webdav.push(data, cfg, 'secret')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(cfg.webdavUrl)
    expect(init.method).toBe('PUT')
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${btoa('me:secret')}`,
    )
    expect(init.body).toBe(JSON.stringify(data))
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 403 })),
    )
    await expect(webdav.push(data, cfg, 's')).rejects.toThrow('webdav_403')
  })

  it('returns null when the backup file does not exist yet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 404 })),
    )
    expect(await webdav.pull(cfg, 's')).toBeNull()
  })

  it('returns the parsed backup when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(data), { status: 200 })),
    )
    expect(await webdav.pull(cfg, 's')).toEqual(data)
  })
})
