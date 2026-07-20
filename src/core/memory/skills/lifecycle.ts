import type { LedgerEvent, RunMeta } from '@/shared/memory/events'
import type { RunLedger } from '../ledger/run-ledger'
import { skillFromRun } from './candidates'
import { matchSkills } from './match'
import { recordSkillSuccess } from './reliability'
import { repairSkill } from './repair'
import { evaluateShadow } from './shadow'
import { saveSkill } from './store'

export interface LifecycleInput {
  meta: RunMeta
  events: LedgerEvent[]
  /** The run's episode deduped against an earlier one — i.e. this goal has
   * now succeeded repeatedly, the trigger for learning a workflow. */
  episodeRepeated: boolean
  ledger?: RunLedger
}

/**
 * Post-run skill lifecycle: shadow-evaluate matching skills, repair degraded
 * ones from the fresh successful trajectory, and mint a new candidate when a
 * goal keeps succeeding without one. All triggers are evidence-based — an
 * uncertain or failed run never reinforces anything here.
 */
export async function updateSkills(input: LifecycleInput): Promise<void> {
  const { meta, events, episodeRepeated, ledger } = input
  const origin = meta.origins[0]
  if (!origin || meta.outcome !== 'completed') return
  const matched = await matchSkills(meta.goal, origin)
  const live = matched.filter((s) => s.state !== 'retired')

  for (const skill of live.filter((s) => s.state === 'draft' || s.state === 'shadow')) {
    const verdict = evaluateShadow(skill, events)
    if (verdict.agreed) {
      const next = await recordSkillSuccess(skill.id)
      ledger?.log('SkillUpdated', { id: skill.id, shadowAgreed: true, state: next?.state })
    } else {
      // Disagreement is recorded, not punished — the planner may simply have
      // found a different valid path; repeated agreement is what promotes.
      ledger?.log('SkillUpdated', {
        id: skill.id,
        shadowAgreed: false,
        mismatches: verdict.mismatches,
      })
    }
  }

  for (const skill of live.filter((s) => s.state === 'degraded')) {
    const repaired = await repairSkill(skill, meta, events)
    if (repaired) {
      ledger?.log('SkillRepaired', {
        oldId: skill.id,
        newId: repaired.id,
        version: repaired.version,
      })
    }
  }

  if (live.length === 0 && episodeRepeated) {
    const candidate = skillFromRun(meta, events, { state: 'shadow' })
    if (candidate) {
      await saveSkill(candidate)
      ledger?.log('SkillCandidateCreated', { id: candidate.id, steps: candidate.steps.length })
    }
  }
}
