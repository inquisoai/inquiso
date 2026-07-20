import type { ActionEvidence, Outcome } from '@/shared/memory/evidence'
import { changeEvidence } from './delta'
import type { ActionSnapshot } from './snapshot'

export interface VerifyInput {
  tool: string
  ok: boolean
  error?: string
  before: ActionSnapshot
  after: ActionSnapshot
  /** What `type`/`selectOption` was supposed to leave in the field. */
  expectedValue?: string
}

export interface Verification {
  outcome: Outcome
  evidence: ActionEvidence[]
}

const uncertain = (evidence: ActionEvidence[]): Verification => ({ outcome: 'uncertain', evidence })
const success = (evidence: ActionEvidence[]): Verification => ({
  outcome: 'verified_success',
  evidence,
})

/** `type` verifies against the exact expected field value; a field that
 * swallowed the input is a verified failure, an unreadable one is uncertain. */
function typedField(input: VerifyInput, evidence: ActionEvidence[]): Verification {
  const value = input.after.element?.value
  if (value === undefined || input.expectedValue === undefined) return uncertain(evidence)
  return value === input.expectedValue
    ? success(evidence)
    : { outcome: 'verified_failure', evidence }
}

/** `selectOption` may match by label, so any settled value change (or an exact
 * value match) verifies; an unchanged mismatch stays uncertain. */
function selectedOption(input: VerifyInput, evidence: ActionEvidence[]): Verification {
  const value = input.after.element?.value
  if (value === undefined) return uncertain(evidence)
  if (value === input.expectedValue || value !== input.before.element?.value) {
    return success(evidence)
  }
  return uncertain(evidence)
}

/**
 * Deterministic outcome classification, separate from the planner. Clicking is
 * not succeeding: only an observed state change is `verified_success`; no
 * observable change is `uncertain`, never silently success (docs/memory-agent).
 */
export function classify(input: VerifyInput): Verification {
  if (!input.ok) {
    return {
      outcome: 'verified_failure',
      evidence: [{ type: 'tool_error', error: (input.error ?? 'unknown_error').slice(0, 500) }],
    }
  }
  const evidence = changeEvidence(input.before, input.after)
  switch (input.tool) {
    case 'navigate': {
      const url = evidence.find((e) => e.type === 'url_changed')
      return url ? success([url]) : uncertain(evidence)
    }
    case 'type':
      return typedField(input, evidence)
    case 'selectOption':
      return selectedOption(input, evidence)
    case 'click':
    case 'submitForm':
      return evidence.length > 0 ? success(evidence) : uncertain([])
    default:
      return uncertain(evidence)
  }
}
