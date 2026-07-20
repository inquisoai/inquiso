import type { BrowserSkill, SkillState } from '@/shared/memory/skill'
import { allSkills } from './store'

const tokens = (s: string): Set<string> =>
  new Set(
    s
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length > 2),
  )

/** Lexical overlap between a task goal and a skill's goal pattern. */
export function goalSimilarity(goal: string, pattern: string): number {
  const g = tokens(goal)
  const p = tokens(pattern)
  if (g.size === 0 || p.size === 0) return 0
  let hits = 0
  for (const t of p) if (g.has(t)) hits += 1
  return hits / p.size
}

const MATCH_FLOOR = 0.4

/** Latest (non-superseded) skills for an origin whose goal pattern matches,
 * best match first, optionally limited to the given states. */
export async function matchSkills(
  goal: string,
  origin: string | undefined,
  states?: readonly SkillState[],
): Promise<BrowserSkill[]> {
  if (!origin) return []
  const all = await allSkills()
  const superseded = new Set(all.map((s) => s.previousVersionId).filter(Boolean))
  return all
    .filter((s) => !superseded.has(s.id) && s.origins.includes(origin))
    .filter((s) => !states || states.includes(s.state))
    .map((s) => ({ s, score: goalSimilarity(goal, s.goalPattern) }))
    .filter(({ score }) => score >= MATCH_FLOOR)
    .sort((a, b) => b.score - a.score)
    .map(({ s }) => s)
}
