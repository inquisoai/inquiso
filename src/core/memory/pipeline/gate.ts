import type { CandidateDecision, MemoryCandidate } from '@/shared/memory/candidate'
import { candidateText, detectSensitive } from './sensitive'

export interface GateResult {
  decision: CandidateDecision
  reason: string
}

const MIN_CONFIDENCE = 0.4

/**
 * The deterministic write gate (docs/memory-agent/security.md). Order matters:
 * safety rules run first and cannot be overridden by the candidate's own
 * `recommendedDecision` — the model proposes, this gate disposes.
 */
export function gateCandidate(c: MemoryCandidate): GateResult {
  const hit = detectSensitive(candidateText(c.summary, c.structuredContent))
  if (hit) return { decision: 'discard', reason: `sensitive content: ${hit.reason}` }
  if (c.sensitivity === 'authentication' || c.sensitivity === 'financial') {
    return { decision: 'discard', reason: `${c.sensitivity} data is never persisted` }
  }
  // Page content is untrusted: anything the website itself supplied can only
  // enter memory quarantined, no matter how it is phrased (poisoning defence).
  if (c.websiteSupplied && c.provenance.source !== 'explicit_user') {
    return { decision: 'quarantine', reason: 'website-supplied content requires user review' }
  }
  if (c.provenance.source === 'explicit_user') {
    return { decision: 'store', reason: 'explicit user request' }
  }
  if (c.confidence < MIN_CONFIDENCE) {
    return { decision: 'discard', reason: `confidence ${c.confidence.toFixed(2)} below floor` }
  }
  // An inferred user preference speaks for the user — the user gets a say.
  if (c.proposedKind === 'preference') {
    return { decision: 'ask_user', reason: 'inferred preference needs user confirmation' }
  }
  if (c.provenance.source === 'successful_episode' || c.provenance.source === 'failed_episode') {
    return { decision: 'store', reason: `verified ${c.proposedKind} from run evidence` }
  }
  if (c.provenance.source === 'browser_observation') {
    return { decision: 'store', reason: 'direct browser observation' }
  }
  // Fall back to the model's recommendation, but never let it self-store.
  return c.recommendedDecision === 'store'
    ? { decision: 'ask_user', reason: 'unrecognized source cannot self-store' }
    : { decision: c.recommendedDecision, reason: 'candidate recommendation' }
}
