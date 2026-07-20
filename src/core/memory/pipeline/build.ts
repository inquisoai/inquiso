import type { MemoryCandidate } from '@/shared/memory/candidate'
import type { MemoryStatus } from '@/shared/memory/enums'
import { newId } from '@/shared/memory/ids'
import { MemoryRecord } from '@/shared/memory/record'

/** Materializes an admitted candidate as a MemoryRecord. */
export function buildRecord(c: MemoryCandidate, status: MemoryStatus): MemoryRecord {
  const now = Date.now()
  return MemoryRecord.parse({
    id: newId('mem'),
    kind: c.proposedKind,
    scope: c.scope,
    content: c.structuredContent,
    summary: c.summary,
    searchableText: c.summary.slice(0, 2000),
    ...(c.slotKey ? { slotKey: c.slotKey } : {}),
    provenance: c.provenance,
    trust: {
      confidence: c.confidence,
      sensitivity: c.sensitivity,
      userConfirmed: c.provenance.source === 'explicit_user',
      websiteSupplied: c.websiteSupplied,
    },
    temporal: { createdAt: now, updatedAt: now, observedAt: now },
    relations: {},
    metrics: {},
    status,
  })
}
