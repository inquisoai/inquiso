import { appStore } from '@/core/data/storage/instance'
import type { ProviderInfo } from '@/shared/providers'
import { createLogger } from '@/shared/util/logger'

const log = createLogger('catalog')
const URL = 'https://models.dev/api.json'
const TTL = 7 * 24 * 60 * 60 * 1000
const PROVIDERS = ['openai', 'anthropic', 'google']
const CAP = 10

const store = appStore('catalog')

interface ModelEntry {
  release_date?: string
  tool_call?: boolean
  modalities?: { output?: string[] }
}
type Catalog = Record<string, string[]>

/** Tool-capable text models for a provider, newest first, capped. */
function pick(models: Record<string, ModelEntry>): string[] {
  return Object.entries(models)
    .filter(([, m]) => m.tool_call && (m.modalities?.output ?? []).includes('text'))
    .sort((a, b) => (b[1].release_date ?? '').localeCompare(a[1].release_date ?? ''))
    .slice(0, CAP)
    .map(([id]) => id)
}

async function fetchCatalog(): Promise<Catalog> {
  const res = await fetch(URL)
  if (!res.ok) throw new Error('catalog_fetch_failed')
  const data = (await res.json()) as Record<string, { models?: Record<string, ModelEntry> }>
  const out: Catalog = {}
  for (const p of PROVIDERS) {
    const models = data[p]?.models
    if (models) out[p] = pick(models)
  }
  return out
}

let refreshing = false

/**
 * models.dev-backed model lists — cached 7 days, refreshed in the background so
 * a call never blocks on the network. Returns {} until the first fetch lands;
 * callers fall back to the built-in lists, so the picker is never empty and
 * stays current without a new build.
 */
export async function getModelCatalog(): Promise<Catalog> {
  const cached = await store.getItem<{ at: number; data: Catalog }>('models')
  if ((!cached || Date.now() - cached.at > TTL) && !refreshing) {
    refreshing = true
    fetchCatalog()
      .then((data) => store.setItem('models', { at: Date.now(), data }))
      // Built-in model lists cover a failed refresh; still worth a trace.
      .catch((e) => log.debug('refresh failed', String(e)))
      .finally(() => {
        refreshing = false
      })
  }
  return cached?.data ?? {}
}

/** A provider's effective model list + default: the live catalog when present,
 * otherwise the built-in fallback. Keeps the shown default in the list. */
export function modelsFor(
  info: Pick<ProviderInfo, 'id' | 'models' | 'defaultModel'>,
  catalog: Catalog,
): { models: string[]; defaultModel: string } {
  const models = catalog[info.id]
  if (!models?.length) return { models: info.models, defaultModel: info.defaultModel }
  return {
    models,
    defaultModel: models.includes(info.defaultModel) ? info.defaultModel : (models[0] ?? ''),
  }
}
