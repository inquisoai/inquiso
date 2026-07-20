import type { BrowserSkill, SkillState } from '@/shared/memory/skill'
import { getSkill, saveSkill } from './store'

/** Promotion/degradation thresholds (docs/memory-agent/browser-skills.md).
 * Verified successes climb draft → shadow → verified; only the user grants
 * `trusted`. Consecutive failures degrade — a degraded skill never retries
 * forever, it waits for repair. */
export const PROMOTE_TO_SHADOW = 2
export const PROMOTE_TO_VERIFIED = 4
export const DEGRADE_AFTER = 2

function promoted(state: SkillState, successCount: number): SkillState {
  if (state === 'trusted' || state === 'retired') return state
  if (successCount >= PROMOTE_TO_VERIFIED) return 'verified'
  if (successCount >= PROMOTE_TO_SHADOW) return 'shadow'
  return state === 'degraded' ? 'shadow' : state
}

/** A verified success reinforces and may promote. Only evidence-verified
 * outcomes may call this (docs/memory-agent §3.4). */
export async function recordSkillSuccess(id: string): Promise<BrowserSkill | null> {
  const skill = await getSkill(id)
  if (!skill) return null
  const successCount = skill.reliability.successCount + 1
  const next: BrowserSkill = {
    ...skill,
    state: promoted(skill.state, successCount),
    reliability: {
      ...skill.reliability,
      successCount,
      consecutiveFailures: 0,
      lastVerifiedAt: Date.now(),
    },
    updatedAt: Date.now(),
  }
  await saveSkill(next)
  return next
}

/** A failure counts against the skill; repeated ones degrade it. */
export async function recordSkillFailure(id: string, reason: string): Promise<BrowserSkill | null> {
  const skill = await getSkill(id)
  if (!skill) return null
  const consecutive = skill.reliability.consecutiveFailures + 1
  const next: BrowserSkill = {
    ...skill,
    state: consecutive >= DEGRADE_AFTER && skill.state !== 'retired' ? 'degraded' : skill.state,
    description:
      consecutive >= DEGRADE_AFTER
        ? `${skill.description} [degraded: ${reason}]`.slice(0, 500)
        : skill.description,
    reliability: {
      ...skill.reliability,
      failureCount: skill.reliability.failureCount + 1,
      consecutiveFailures: consecutive,
      lastFailureAt: Date.now(),
    },
    updatedAt: Date.now(),
  }
  await saveSkill(next)
  return next
}

/** Explicit user vote of confidence — the only path to `trusted`. */
export async function trustSkill(id: string): Promise<BrowserSkill | null> {
  const skill = await getSkill(id)
  if (!skill || skill.state === 'retired') return null
  const next = { ...skill, state: 'trusted' as const, updatedAt: Date.now() }
  await saveSkill(next)
  return next
}

export async function retireSkill(id: string): Promise<void> {
  const skill = await getSkill(id)
  if (!skill) return
  await saveSkill({ ...skill, state: 'retired', updatedAt: Date.now() })
}
