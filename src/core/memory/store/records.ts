import { appStore } from '@/core/data/storage/instance'
import { MemoryRecord } from '@/shared/memory/record'

/**
 * Memory repository (IndexedDB via localForage). Local only, never synced;
 * "forget" is a real record removal, not a soft hide. Reads are Zod-validated:
 * a corrupt record is treated as absent, never trusted.
 */
const store = appStore('memories')
const MAX_MEMORIES = 2000

export async function getMemory(id: string): Promise<MemoryRecord | null> {
  const parsed = MemoryRecord.safeParse(await store.getItem(id))
  return parsed.success ? parsed.data : null
}

export async function saveMemory(record: MemoryRecord): Promise<void> {
  await store.setItem(record.id, record)
  await trim()
}

/** Real delete — the record is gone, not status-flipped. */
export async function deleteMemory(id: string): Promise<void> {
  await store.removeItem(id)
}

/** Every validated memory (any status), most recently updated first. */
export async function allMemories(): Promise<MemoryRecord[]> {
  const all: MemoryRecord[] = []
  await store.iterate((value) => {
    const parsed = MemoryRecord.safeParse(value)
    if (parsed.success) all.push(parsed.data)
  })
  return all.sort((a, b) => b.temporal.updatedAt - a.temporal.updatedAt)
}

export async function clearMemories(origin?: string): Promise<number> {
  const all = await allMemories()
  const doomed = origin ? all.filter((m) => m.scope.origin === origin) : all
  await Promise.all(doomed.map((m) => store.removeItem(m.id)))
  return doomed.length
}

/** Retention: never-retrieved, least-recently-updated records go first;
 * superseded/expired history is trimmed before anything active. */
async function trim(): Promise<void> {
  const all = await allMemories()
  if (all.length <= MAX_MEMORIES) return
  const keepScore = (m: MemoryRecord): number =>
    (m.status === 'active' ? 2 : 0) + (m.metrics.usefulCount > 0 ? 1 : 0)
  const doomed = all
    .sort((a, b) => keepScore(a) - keepScore(b) || a.temporal.updatedAt - b.temporal.updatedAt)
    .slice(0, all.length - MAX_MEMORIES)
  await Promise.all(doomed.map((m) => store.removeItem(m.id)))
}
