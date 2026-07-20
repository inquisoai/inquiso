import { browser } from '@/platform'
import type { CustomProvider } from '@/shared/custom-provider'
import type { McpServer } from '@/shared/mcp'
import type { SyncConfig } from '@/shared/sync'
import { DEFAULTS, Settings } from './schema'

export type { Settings } from './schema'

/** The one `storage.local` read: Zod-validated, so a corrupt record degrades
 * field-by-field to defaults instead of being trusted (docs/05). */
export async function getSettings(): Promise<Settings> {
  const { settings } = await browser.storage.local.get('settings')
  const parsed = Settings.safeParse(settings)
  return parsed.success ? parsed.data : DEFAULTS
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch }
  await browser.storage.local.set({ settings: next })
  return next
}

/** Cloud-backup config (validated by the Settings schema on read). */
export async function getSyncConfig(): Promise<SyncConfig> {
  return (await getSettings()).sync
}
export async function setSyncConfig(patch: Partial<SyncConfig>): Promise<SyncConfig> {
  const next = { ...(await getSyncConfig()), ...patch }
  await setSettings({ sync: next })
  return next
}

/** Adds (or replaces by id) an MCP server. */
export async function addMcpServer(server: McpServer): Promise<void> {
  const { mcpServers } = await getSettings()
  await setSettings({ mcpServers: [...mcpServers.filter((s) => s.id !== server.id), server] })
}

/** Removes an MCP server by id. */
export async function removeMcpServer(id: string): Promise<void> {
  const { mcpServers } = await getSettings()
  await setSettings({ mcpServers: mcpServers.filter((s) => s.id !== id) })
}

/** Stored custom providers (corrupt entries already dropped by the schema). */
export async function getCustomProviders(): Promise<CustomProvider[]> {
  return (await getSettings()).customProviders
}

export async function setModel(provider: string, modelId: string): Promise<void> {
  const current = await getSettings()
  await setSettings({ models: { ...current.models, [provider]: modelId } })
}

/** Adds (or replaces by id) a custom provider and selects it. */
export async function addCustomProvider(p: CustomProvider): Promise<void> {
  const current = await getSettings()
  const rest = current.customProviders.filter((x) => x.id !== p.id)
  await setSettings({ providerId: p.id, customProviders: [...rest, p] })
}

/** Removes a custom provider; falls back to the on-device default if it was
 * the active one. */
export async function removeCustomProvider(id: string): Promise<void> {
  const current = await getSettings()
  await setSettings({
    customProviders: current.customProviders.filter((x) => x.id !== id),
    ...(current.providerId === id ? { providerId: DEFAULTS.providerId } : {}),
  })
}
