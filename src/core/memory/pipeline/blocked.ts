import { appStore } from '@/core/data/storage/instance'
import { BlockedAttempt } from '@/shared/memory/candidate'

/** Rejected/quarantined write attempts, capped, for the Memory Center's
 * "Blocked memory attempts" view. Summaries are pre-redacted by the caller. */
const store = appStore('memory-blocked')
const MAX_ATTEMPTS = 50

export async function recordBlocked(attempt: BlockedAttempt): Promise<void> {
  await store.setItem(`${attempt.at}_${Math.random().toString(36).slice(2, 6)}`, attempt)
  const keys = (await store.keys()).sort()
  const excess = keys.slice(0, Math.max(0, keys.length - MAX_ATTEMPTS))
  await Promise.all(excess.map((k) => store.removeItem(k)))
}

export async function listBlocked(): Promise<BlockedAttempt[]> {
  const all: BlockedAttempt[] = []
  await store.iterate((value) => {
    const parsed = BlockedAttempt.safeParse(value)
    if (parsed.success) all.push(parsed.data)
  })
  return all.sort((a, b) => b.at - a.at)
}

export async function clearBlocked(): Promise<void> {
  await store.clear()
}
