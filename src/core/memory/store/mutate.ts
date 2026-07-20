import type { ScopeLevel } from '@/shared/memory/enums'
import type { MemoryRecord } from '@/shared/memory/record'
import { deleteMemory, getMemory, saveMemory } from './records'

const touch = (m: MemoryRecord): MemoryRecord => ({
  ...m,
  temporal: { ...m.temporal, updatedAt: Date.now() },
})

async function update(
  id: string,
  fn: (m: MemoryRecord) => MemoryRecord,
): Promise<MemoryRecord | null> {
  const m = await getMemory(id)
  if (!m) return null
  const next = touch(fn(m))
  await saveMemory(next)
  return next
}

/** The user vouched for this memory (raises trust; activates quarantined). */
export const confirmMemory = (id: string) =>
  update(id, (m) => ({
    ...m,
    status: m.status === 'quarantined' || m.status === 'candidate' ? 'active' : m.status,
    trust: { ...m.trust, userConfirmed: true, confidence: Math.max(m.trust.confidence, 0.9) },
  }))

/** The user flagged this memory as wrong — it stops informing anything. */
export const markIncorrect = (id: string) =>
  update(id, (m) => ({
    ...m,
    status: 'expired',
    metrics: { ...m.metrics, misleadingCount: m.metrics.misleadingCount + 1 },
  }))

export const editSummary = (id: string, summary: string) =>
  update(id, (m) => ({ ...m, summary, searchableText: summary }))

export const changeScope = (id: string, level: ScopeLevel) =>
  update(id, (m) => ({ ...m, scope: { ...m.scope, level } }))

/** Forget = real delete (docs/06: clears are real deletes). */
export const forgetMemory = (id: string): Promise<void> => deleteMemory(id)

/** Temporal supersession: the old fact is preserved for provenance, marked
 * superseded and closed (`validUntil`); the new record points back at it. */
export async function supersedeMemory(oldId: string, next: MemoryRecord): Promise<MemoryRecord> {
  const now = Date.now()
  await update(oldId, (m) => ({
    ...m,
    status: 'superseded',
    temporal: { ...m.temporal, validUntil: now },
    relations: { ...m.relations, contradictedById: next.id },
  }))
  const linked: MemoryRecord = {
    ...next,
    temporal: { ...next.temporal, validFrom: now },
    relations: { ...next.relations, supersedesId: oldId },
  }
  await saveMemory(linked)
  return linked
}

/** Retrieval bookkeeping for ranking (usefulness feedback loop). */
export async function touchRetrieved(ids: string[]): Promise<void> {
  const now = Date.now()
  await Promise.all(
    ids.map((id) =>
      update(id, (m) => ({
        ...m,
        temporal: { ...m.temporal, lastUsedAt: now },
        metrics: { ...m.metrics, retrievalCount: m.metrics.retrievalCount + 1 },
      })),
    ),
  )
}

/** Reinforce instead of duplicate: a re-observed memory gains confidence. */
export const reinforceMemory = (id: string, confidence: number) =>
  update(id, (m) => ({
    ...m,
    trust: {
      ...m.trust,
      confidence: Math.min(0.99, Math.max(m.trust.confidence, confidence) + 0.05),
    },
    temporal: { ...m.temporal, observedAt: Date.now() },
    metrics: { ...m.metrics, usefulCount: m.metrics.usefulCount + 1 },
  }))
