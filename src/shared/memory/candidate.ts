import { z } from 'zod'
import { MemoryKind, MemorySource, Sensitivity } from './enums'
import { MemoryScope } from './record'

export const EXPECTED_VALUES = [
  'task_resume',
  'personalization',
  'site_navigation',
  'failure_avoidance',
  'workflow_reuse',
  'policy',
] as const

export const CANDIDATE_DECISIONS = ['store', 'ask_user', 'quarantine', 'discard'] as const
export const CandidateDecision = z.enum(CANDIDATE_DECISIONS)
export type CandidateDecision = z.infer<typeof CandidateDecision>

/**
 * A proposed memory. The model (or a tool) may *propose*, never commit: every
 * candidate passes the deterministic write gate (pipeline/gate.ts) before any
 * record is stored — secrets are discarded, page-derived content quarantined.
 */
export const MemoryCandidate = z.object({
  proposedKind: MemoryKind,
  summary: z.string().min(1).max(500),
  structuredContent: z.record(z.string(), z.unknown()).default({}),
  slotKey: z.string().max(120).optional(),
  scope: MemoryScope,
  provenance: z.object({
    source: MemorySource,
    eventIds: z.array(z.string()).default([]),
    runIds: z.array(z.string()).default([]),
    url: z.string().optional(),
  }),
  confidence: z.number().min(0).max(1),
  sensitivity: Sensitivity,
  /** True when the substance originated in page content, not user/agent state. */
  websiteSupplied: z.boolean(),
  expectedValue: z.enum(EXPECTED_VALUES),
  /** Advisory only — the deterministic gate can always override. */
  recommendedDecision: CandidateDecision,
})
export type MemoryCandidate = z.infer<typeof MemoryCandidate>

/** A rejected/quarantined write attempt, kept for the Memory Center. */
export const BlockedAttempt = z.object({
  at: z.number(),
  summary: z.string().max(300),
  decision: CandidateDecision,
  reason: z.string().max(300),
  origin: z.string().optional(),
})
export type BlockedAttempt = z.infer<typeof BlockedAttempt>
