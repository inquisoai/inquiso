import { getMemory, saveMemory } from './records'

/**
 * Model-facing memory feedback — deliberately the narrowest possible write
 * surface. The model may adjust usefulness *counters* (which feed retrieval
 * ranking) but can never set userConfirmed, change confidence, promote a
 * skill, or alter status: those transitions stay with the deterministic
 * pipeline and the user (docs/memory-agent/security.md).
 */
async function bump(id: string, key: 'usefulCount' | 'misleadingCount'): Promise<boolean> {
  const m = await getMemory(id)
  if (!m) return false
  await saveMemory({
    ...m,
    metrics: { ...m.metrics, [key]: m.metrics[key] + 1 },
    temporal: { ...m.temporal, updatedAt: Date.now() },
  })
  return true
}

export const feedbackUseful = (id: string): Promise<boolean> => bump(id, 'usefulCount')

export const feedbackMisleading = (id: string): Promise<boolean> => bump(id, 'misleadingCount')
