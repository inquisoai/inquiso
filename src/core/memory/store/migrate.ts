import { appStore } from '@/core/data/storage/instance'
import { admitCandidate } from '../pipeline/admit'

/**
 * One-shot migration of the legacy flat remember/recall KV (store 'memory')
 * into typed MemoryRecords. Each note routes through the write gate, so a
 * previously-saved secret is discarded rather than carried forward. The old
 * store is cleared afterwards (real delete).
 */
const legacy = appStore('memory')

/** Data-quality sweep for records written before the gate learned better:
 * reflections that memorized transient environment errors (permissions,
 * rejected confirms) and episodes with no reusable verified steps. Invariant-
 * based, so it is safe to run on every startup. */
export async function sweepJunkMemories(): Promise<number> {
  const { allMemories, deleteMemory } = await import('./records')
  const ENV =
    /page_access_needed|host_permission_needed|permission|user_rejected|missing_api_key|no_active_tab|tab_unreadable|cannot access/i
  const { isVacuousFact } = await import('../pipeline/fact-filter')
  let removed = 0
  for (const m of await allMemories()) {
    const emptyStrategy =
      m.kind === 'episode' && (m.content as { strategy?: unknown[] }).strategy?.length === 0
    const vacuous =
      (m.kind === 'site_knowledge' || m.kind === 'fact') &&
      m.provenance.source !== 'explicit_user' &&
      isVacuousFact(m.summary)
    if ((m.kind === 'reflection' && ENV.test(m.summary)) || emptyStrategy || vacuous) {
      await deleteMemory(m.id)
      removed += 1
    }
  }
  return removed
}

export async function migrateLegacyMemory(): Promise<number> {
  const keys = await legacy.keys()
  if (keys.length === 0) return 0
  let migrated = 0
  for (const key of keys) {
    const value = await legacy.getItem(key)
    if (typeof value === 'string' && value.trim()) {
      const result = await admitCandidate({
        proposedKind: 'fact',
        summary: `${key}: ${value}`.slice(0, 500),
        structuredContent: { legacyKey: key },
        scope: { level: 'user' },
        provenance: { source: 'explicit_user', eventIds: [], runIds: [] },
        confidence: 0.8,
        sensitivity: 'personal',
        websiteSupplied: false,
        expectedValue: 'personalization',
        recommendedDecision: 'store',
      })
      if (result.decision === 'stored' || result.decision === 'reinforced') migrated += 1
    }
  }
  await legacy.clear()
  return migrated
}
