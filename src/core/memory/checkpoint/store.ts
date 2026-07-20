import { appStore } from '@/core/data/storage/instance'
import { Checkpoint } from '@/shared/memory/checkpoint'

/** Checkpoints keyed by taskId — one live resume point per task. Reads are
 * Zod-validated; a corrupt checkpoint is treated as absent, never trusted. */
const store = appStore('checkpoints')

export async function getCheckpoint(taskId: string): Promise<Checkpoint | null> {
  const parsed = Checkpoint.safeParse(await store.getItem(taskId))
  return parsed.success ? parsed.data : null
}

export async function saveCheckpoint(cp: Checkpoint): Promise<void> {
  await store.setItem(cp.taskId, cp)
}

export async function removeCheckpoint(taskId: string): Promise<void> {
  await store.removeItem(taskId)
}
