import type { RunLedger } from '@/core/memory/ledger/run-ledger'
import type { MemoryCandidate } from '@/shared/memory/candidate'
import type { MemoryRecord } from '@/shared/memory/record'
import { reinforceMemory, supersedeMemory } from '../store/mutate'
import { listMemories, textSimilarity } from '../store/query'
import { saveMemory } from '../store/records'
import { recordBlocked } from './blocked'
import { buildRecord } from './build'
import { gateCandidate } from './gate'

const DUPLICATE_SIMILARITY = 0.8

export interface AdmitResult {
  decision: 'stored' | 'reinforced' | 'superseded' | 'ask_user' | 'quarantined' | 'discarded'
  record?: MemoryRecord
  reason: string
}

/** Active same-kind memories in the same scope — dedupe/conflict pool. */
async function related(c: MemoryCandidate): Promise<MemoryRecord[]> {
  const pool = await listMemories({ kind: c.proposedKind, currentOnly: true })
  return pool.filter((m) => m.scope.level === c.scope.level && m.scope.origin === c.scope.origin)
}

/**
 * The write pipeline: deterministic gate → dedupe (reinforce, don't duplicate)
 * → conflict resolution (temporal supersession by slot) → store. Every outcome
 * is ledger-logged; blocked attempts are visible in the Memory Center.
 */
export async function admitCandidate(c: MemoryCandidate, ledger?: RunLedger): Promise<AdmitResult> {
  ledger?.log('MemoryCandidateCreated', { kind: c.proposedKind, summary: c.summary.slice(0, 200) })
  const gate = gateCandidate(c)

  if (gate.decision === 'discard') {
    ledger?.log('MemoryRejected', { reason: gate.reason })
    // Redacted: only the kind + reason are kept, never the rejected content.
    await recordBlocked({
      at: Date.now(),
      summary: `${c.proposedKind} candidate`,
      decision: 'discard',
      reason: gate.reason,
      ...(c.scope.origin ? { origin: c.scope.origin } : {}),
    })
    return { decision: 'discarded', reason: gate.reason }
  }
  if (gate.decision === 'quarantine') {
    const record = buildRecord(c, 'quarantined')
    await saveMemory(record)
    ledger?.log('MemoryQuarantined', { id: record.id, reason: gate.reason })
    await recordBlocked({
      at: Date.now(),
      summary: c.summary.slice(0, 300),
      decision: 'quarantine',
      reason: gate.reason,
      ...(c.scope.origin ? { origin: c.scope.origin } : {}),
    })
    return { decision: 'quarantined', record, reason: gate.reason }
  }
  if (gate.decision === 'ask_user') {
    const record = buildRecord(c, 'candidate')
    await saveMemory(record)
    ledger?.log('MemoryCandidateCreated', { id: record.id, pending: true })
    return { decision: 'ask_user', record, reason: gate.reason }
  }

  const pool = await related(c)
  const duplicate = pool.find(
    (m) => textSimilarity(m.searchableText, c.summary) >= DUPLICATE_SIMILARITY,
  )
  if (duplicate) {
    await reinforceMemory(duplicate.id, c.confidence)
    ledger?.log('MemoryPromoted', { id: duplicate.id, reinforced: true })
    return { decision: 'reinforced', record: duplicate, reason: 'duplicate reinforced' }
  }
  const record = buildRecord(c, 'active')
  const conflict = c.slotKey ? pool.find((m) => m.slotKey === c.slotKey) : undefined
  if (conflict) {
    const stored = await supersedeMemory(conflict.id, record)
    ledger?.log('MemorySuperseded', { oldId: conflict.id, newId: stored.id })
    return { decision: 'superseded', record: stored, reason: `superseded ${conflict.id}` }
  }
  await saveMemory(record)
  ledger?.log('MemoryPromoted', { id: record.id })
  return { decision: 'stored', record, reason: gate.reason }
}
