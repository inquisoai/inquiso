import { appStore } from '@/core/data/storage/instance'

/**
 * localForage-backed vector cache (IndexedDB). Embeddings are expensive to
 * compute/fetch but cheap to store, so caching by model+content hash means each
 * page is embedded once (docs/06-caching-memory.md). LRU-capped by entry count.
 */
const store = appStore('embeddings')
const MAX_ENTRIES = 500

interface Entry {
  v: number[]
  t: number
}

export async function getVector(key: string): Promise<number[] | null> {
  const entry = await store.getItem<Entry>(key)
  return entry ? entry.v : null
}

export async function setVector(key: string, v: number[]): Promise<void> {
  await store.setItem<Entry>(key, { v, t: Date.now() })
  await trim()
}

/** Drops the least-recently-written entries once over the cap. */
async function trim(): Promise<void> {
  if ((await store.length()) <= MAX_ENTRIES) return
  const entries: Array<{ key: string; t: number }> = []
  await store.iterate<Entry, void>((value, key) => {
    entries.push({ key, t: value.t })
  })
  entries.sort((a, b) => a.t - b.t)
  const excess = entries.slice(0, entries.length - MAX_ENTRIES)
  await Promise.all(excess.map((e) => store.removeItem(e.key)))
}
