import { afterEach, describe, expect, it, vi } from 'vitest'
import { createBackupGist, gist } from '@/core/data/sync/providers/gist'
import type { SyncConfig } from '@/shared/sync'

const cfg: SyncConfig = { mode: 'manual', providerId: 'gist', gistId: 'abc123' }
const data = { v: 1 as const, exportedAt: 1, conversations: [] }
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

afterEach(() => vi.unstubAllGlobals())

describe('gist provider', () => {
  it('creates a private backup gist and returns its id', async () => {
    const fetchMock = vi.fn(async (_u: string, _i: RequestInit) => json({ id: 'newid' }, 201))
    vi.stubGlobal('fetch', fetchMock)
    expect(await createBackupGist('tok')).toBe('newid')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.github.com/gists')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })

  it('throws on a bad token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 401 })),
    )
    await expect(createBackupGist('bad')).rejects.toThrow('gist_401')
  })

  it('PATCHes the export to the existing gist', async () => {
    const fetchMock = vi.fn(async (_u: string, _i: RequestInit) => json({}, 200))
    vi.stubGlobal('fetch', fetchMock)
    await gist.push(data, cfg, 'tok')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.github.com/gists/abc123')
    expect(init.method).toBe('PATCH')
  })

  it('pulls and parses the backup file', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        json({ files: { 'inquiso-backup.json': { content: JSON.stringify(data) } } }),
      ),
    )
    expect(await gist.pull(cfg, 'tok')).toEqual(data)
  })

  it('returns null when the gist is gone', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 404 })),
    )
    expect(await gist.pull(cfg, 'tok')).toBeNull()
  })
})
