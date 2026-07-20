import type { LedgerEvent, RunMeta } from '@/shared/memory/events'
import type { BrowserSkill } from '@/shared/memory/skill'
import { skillFromRun } from './candidates'
import { saveSkill } from './store'

/**
 * Skill repair: a degraded skill's task later succeeded via general
 * reasoning. The new verified trajectory becomes the next version — in
 * shadow, so it must re-earn trust — and the old version is preserved in the
 * chain, never rewritten. Returns the repaired version, or null when the new
 * run didn't yield a usable trajectory.
 */
export async function repairSkill(
  degraded: BrowserSkill,
  meta: RunMeta,
  events: LedgerEvent[],
): Promise<BrowserSkill | null> {
  const next = skillFromRun(meta, events, {
    state: 'shadow',
    version: degraded.version + 1,
    previousVersionId: degraded.id,
  })
  if (!next) return null
  const repaired: BrowserSkill = {
    ...next,
    name: degraded.name,
    description: `Repaired v${degraded.version + 1} of: ${degraded.name}`.slice(0, 500),
    goalPattern: degraded.goalPattern,
    learnedFrom: {
      runIds: [...degraded.learnedFrom.runIds, meta.runId],
      episodeIds: degraded.learnedFrom.episodeIds,
    },
  }
  await saveSkill(repaired)
  return repaired
}

/** Human-readable diff of what the repair changed (Memory Center display). */
export function repairDiff(oldSkill: BrowserSkill, newSkill: BrowserSkill): string[] {
  const olds = oldSkill.steps.map((s) => s.description)
  const news = newSkill.steps.map((s) => s.description)
  return [
    ...news.filter((d) => !olds.includes(d)).map((d) => `+ ${d}`),
    ...olds.filter((d) => !news.includes(d)).map((d) => `- ${d}`),
  ]
}
