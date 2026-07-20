import { revokeHostPermission } from '@/core/auth/host-permissions'
import { getCustomProviders, getSettings, getSyncConfig } from '@/core/data/settings/store'
import { getSyncProvider } from '@/core/data/sync/registry'

/** Every endpoint URL still configured across surfaces (custom providers, MCP
 * servers, cloud backup) — the set whose origins must keep their grants. */
async function configuredUrls(): Promise<string[]> {
  const [providers, settings, sync] = await Promise.all([
    getCustomProviders(),
    getSettings(),
    getSyncConfig(),
  ])
  const syncUrl = sync.providerId ? getSyncProvider(sync.providerId)?.endpoint(sync) : undefined
  return [
    ...providers.map((p) => p.baseURL),
    ...settings.mcpServers.map((s) => s.url),
    ...(syncUrl ? [syncUrl] : []),
  ]
}

/** Drops the origin grant of a just-removed endpoint so grants don't accumulate
 * forever — unless another configured endpoint shares the origin. Call AFTER
 * the removal has been persisted. */
export async function releaseOriginGrant(url: string): Promise<void> {
  await revokeHostPermission(url, await configuredUrls())
}
