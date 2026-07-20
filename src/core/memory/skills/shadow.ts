import type { LedgerEvent } from '@/shared/memory/events'
import type { BrowserSkill, SkillStep } from '@/shared/memory/skill'
import { normalizeTrajectory } from './normalize'

export interface ShadowVerdict {
  agreed: boolean
  mismatches: string[]
}

const stepKey = (s: SkillStep): string =>
  `${s.action}:${s.locator?.accessibleName ?? pathOf(s.url) ?? ''}`.toLowerCase()

function pathOf(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

/**
 * Shadow testing: the skill predicted a plan; the planner acted independently.
 * Agreement means the skill's steps appear (in order) inside the run's actual
 * verified trajectory — only then does the shadow skill earn a success. No
 * extra permissions are ever granted for shadowing; it is pure comparison.
 */
export function evaluateShadow(skill: BrowserSkill, events: LedgerEvent[]): ShadowVerdict {
  const actual = normalizeTrajectory(events).steps.map(stepKey)
  const mismatches: string[] = []
  let cursor = 0
  for (const step of skill.steps) {
    const key = stepKey(step)
    const at = actual.indexOf(key, cursor)
    if (at === -1) mismatches.push(`missing: ${step.description}`)
    else cursor = at + 1
  }
  return { agreed: mismatches.length === 0, mismatches }
}
