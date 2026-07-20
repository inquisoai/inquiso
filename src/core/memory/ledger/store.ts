import { appStore } from '@/core/data/storage/instance'
import { LedgerEvent, RunMeta } from '@/shared/memory/events'

/**
 * Append-only event ledger + run index (IndexedDB via localForage). Events are
 * keyed `runId:seq` so a run's history reads back in order; runs are capped
 * and each expired run takes its events with it. Local only, real deletes.
 */
const events = appStore('ledger')
const runs = appStore('runs')
const MAX_RUNS = 100

const eventKey = (runId: string, seq: number): string => `${runId}:${String(seq).padStart(6, '0')}`

export async function putEvent(e: LedgerEvent): Promise<void> {
  await events.setItem(eventKey(e.runId, e.seq), e)
}

/** All validated events of one run, in seq order. */
export async function eventsForRun(runId: string): Promise<LedgerEvent[]> {
  const out: LedgerEvent[] = []
  await events.iterate((value, key) => {
    if (!key.startsWith(`${runId}:`)) return
    const parsed = LedgerEvent.safeParse(value)
    if (parsed.success) out.push(parsed.data)
  })
  return out.sort((a, b) => a.seq - b.seq)
}

export async function saveRun(meta: RunMeta): Promise<void> {
  await runs.setItem(meta.runId, meta)
  await trim()
}

export async function getRun(runId: string): Promise<RunMeta | null> {
  const parsed = RunMeta.safeParse(await runs.getItem(runId))
  return parsed.success ? parsed.data : null
}

/** Every recorded run, newest first. */
export async function listRuns(): Promise<RunMeta[]> {
  const all: RunMeta[] = []
  await runs.iterate((value) => {
    const parsed = RunMeta.safeParse(value)
    if (parsed.success) all.push(parsed.data)
  })
  return all.sort((a, b) => b.startedAt - a.startedAt)
}

export async function runsForTask(taskId: string): Promise<RunMeta[]> {
  return (await listRuns()).filter((r) => r.taskId === taskId)
}

/** Removes a run and all of its events (used by GC and "clear history"). */
export async function dropRun(runId: string): Promise<void> {
  await runs.removeItem(runId)
  const keys = (await events.keys()).filter((k) => k.startsWith(`${runId}:`))
  await Promise.all(keys.map((k) => events.removeItem(k)))
}

async function trim(): Promise<void> {
  const excess = (await listRuns()).slice(MAX_RUNS)
  for (const run of excess) await dropRun(run.runId)
}
