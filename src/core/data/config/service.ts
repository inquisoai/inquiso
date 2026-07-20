import { hasKey, removeKey, setKey } from '@/core/auth/secret-store'
import {
  addCustomProvider,
  addMcpServer,
  getCustomProviders,
  getSettings,
  getSyncConfig,
  removeCustomProvider,
  removeMcpServer,
  setModel,
  setSettings,
} from '@/core/data/settings/store'
import { getModelCatalog, modelsFor } from '@/core/providers/catalog'
import { customDef } from '@/core/providers/defs/compatible'
import { providerInfos, toInfo } from '@/core/providers/registry'
import type { Autonomy } from '@/shared/autonomy'
import type { AppConfig } from '@/shared/config'
import { type CustomProvider, slugId } from '@/shared/custom-provider'
import { mcpId, mcpTokenKey } from '@/shared/mcp'
import { releaseOriginGrant } from './grants'

/** All provider metadata for the UI: built-ins + gateways + the user's own,
 * with model lists refreshed from the live models.dev catalog. */
async function allInfos() {
  const custom = (await getCustomProviders()).map((p) => toInfo(customDef(p)))
  const catalog = await getModelCatalog()
  return [...providerInfos, ...custom].map((p) => ({ ...p, ...modelsFor(p, catalog) }))
}

/** Assembles the UI-facing config (settings + provider metadata + key presence,
 * never the keys themselves). Background-only. */
export async function getConfig(): Promise<AppConfig> {
  const { providerId, models, reasoning, webSearch, autonomy, mcpServers } = await getSettings()
  const providers = await allInfos()
  const statuses = await Promise.all(
    providers.map(async (p) => [p.id, await hasKey(p.id)] as const),
  )
  return {
    providerId,
    models,
    providers,
    keyStatus: Object.fromEntries(statuses),
    reasoning,
    webSearch,
    autonomy,
    mcpServers,
    sync: await getSyncConfig(),
  }
}

/** Registers an MCP server; its bearer token (if any) is stored encrypted,
 * separate from the synced metadata. */
export async function addMcp(spec: { label: string; url: string; token?: string }): Promise<void> {
  const id = mcpId(spec.label)
  await addMcpServer({ id, label: spec.label, url: spec.url, auth: !!spec.token })
  if (spec.token) await setKey(mcpTokenKey(id), spec.token)
}

export async function removeMcp(id: string): Promise<void> {
  const url = (await getSettings()).mcpServers.find((s) => s.id === id)?.url
  await removeMcpServer(id)
  await removeKey(mcpTokenKey(id))
  if (url) await releaseOriginGrant(url)
}

export const setReasoning = (enabled: boolean): Promise<unknown> =>
  setSettings({ reasoning: enabled })
export const setWebSearch = (enabled: boolean): Promise<unknown> =>
  setSettings({ webSearch: enabled })
export const setAutonomy = (autonomy: Autonomy): Promise<unknown> => setSettings({ autonomy })

export const selectProvider = (providerId: string): Promise<unknown> => setSettings({ providerId })
export const selectModel = (provider: string, modelId: string): Promise<void> =>
  setModel(provider, modelId)
export const saveKey = (provider: string, apiKey: string): Promise<void> => setKey(provider, apiKey)
export const deleteKey = (provider: string): Promise<void> => removeKey(provider)

/** Registers a user-defined OpenAI-compatible provider (host permission is
 * granted separately in the UI). Returns its generated id. */
export async function addProvider(spec: Omit<CustomProvider, 'id'>): Promise<string> {
  const provider: CustomProvider = { ...spec, id: slugId(spec.label) }
  await addCustomProvider(provider)
  return provider.id
}

export async function removeProvider(id: string): Promise<void> {
  const url = (await getCustomProviders()).find((p) => p.id === id)?.baseURL
  await removeCustomProvider(id)
  await removeKey(id)
  if (url) await releaseOriginGrant(url)
}
