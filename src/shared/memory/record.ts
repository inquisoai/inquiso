import { z } from 'zod'
import { MemoryKind, MemorySource, MemoryStatus, ScopeLevel, Sensitivity } from './enums'

export const MemoryScope = z.object({
  level: ScopeLevel,
  taskId: z.string().optional(),
  tabId: z.number().optional(),
  origin: z.string().optional(),
  workspaceId: z.string().optional(),
})
export type MemoryScope = z.infer<typeof MemoryScope>

/** One durable memory. Structured, scoped, deduplicated, inspectable, and
 * linked to provenance — never a raw transcript (docs/memory-agent). */
export const MemoryRecord = z.object({
  id: z.string(),
  kind: MemoryKind,
  scope: MemoryScope,
  /** Kind-specific structured content (episode/skill payloads live here). */
  content: z.record(z.string(), z.unknown()).default({}),
  /** One-line statement of the memory, shown in the Memory Center. */
  summary: z.string().max(500),
  /** Lexical retrieval text (summary + salient terms). */
  searchableText: z.string().max(2000),
  /** Deterministic conflict key: two active memories sharing kind+scope+slot
   * contradict each other and the newer supersedes (e.g. 'billing-location'). */
  slotKey: z.string().max(120).optional(),
  provenance: z.object({
    source: MemorySource,
    eventIds: z.array(z.string()).default([]),
    runIds: z.array(z.string()).default([]),
    url: z.string().optional(),
  }),
  trust: z.object({
    confidence: z.number().min(0).max(1),
    sensitivity: Sensitivity,
    userConfirmed: z.boolean(),
    websiteSupplied: z.boolean(),
  }),
  temporal: z.object({
    createdAt: z.number(),
    updatedAt: z.number(),
    observedAt: z.number(),
    lastUsedAt: z.number().optional(),
    expiresAt: z.number().optional(),
    validFrom: z.number().optional(),
    validUntil: z.number().optional(),
  }),
  relations: z.object({
    supersedesId: z.string().optional(),
    contradictedById: z.string().optional(),
    derivedFromIds: z.array(z.string()).default([]),
    relatedIds: z.array(z.string()).default([]),
  }),
  metrics: z.object({
    retrievalCount: z.number().int().default(0),
    usefulCount: z.number().int().default(0),
    misleadingCount: z.number().int().default(0),
  }),
  status: MemoryStatus,
})
export type MemoryRecord = z.infer<typeof MemoryRecord>

/** True when the memory is live for retrieval at `now` (status + temporal). */
export function isCurrent(m: MemoryRecord, now: number): boolean {
  if (m.status !== 'active') return false
  if (m.temporal.expiresAt !== undefined && now >= m.temporal.expiresAt) return false
  if (m.temporal.validFrom !== undefined && now < m.temporal.validFrom) return false
  if (m.temporal.validUntil !== undefined && now >= m.temporal.validUntil) return false
  return true
}
