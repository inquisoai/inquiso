import type { ToolContext } from '@/core/agent/tools/context'
import type { BrowserSkill } from '@/shared/memory/skill'
import { recordSkillFailure, recordSkillSuccess } from './reliability'
import { runStep } from './step'

export interface SkillRunResult {
  ok: boolean
  completedSteps: number
  totalSteps: number
  state?: string
  error?: string
  failedStep?: string
}

/**
 * Replays a learned skill step by step. Every step goes through the same
 * confirmation gate and outcome verifier as a model-issued action — a skill
 * grants no extra authority. A missing element or verified failure stops the
 * run immediately (reliability takes the hit; the planner recovers with
 * general reasoning) instead of blindly pressing on.
 */
export async function executeSkill(
  skill: BrowserSkill,
  inputs: Record<string, string>,
  ctx: ToolContext,
): Promise<SkillRunResult> {
  const total = skill.steps.length
  for (const [i, step] of skill.steps.entries()) {
    const result = await runStep(step, inputs, ctx)
    if (!result.ok) {
      const after = await recordSkillFailure(skill.id, `${step.description}: ${result.error}`)
      if (after?.state === 'degraded') {
        ctx.ledger?.log('SkillDegraded', {
          id: skill.id,
          reason: result.error,
          step: step.description,
        })
      }
      ctx.ledger?.log(
        'SkillExecuted',
        { id: skill.id, ok: false, completedSteps: i },
        { actor: 'skill' },
      )
      return {
        ok: false,
        completedSteps: i,
        totalSteps: total,
        ...(after?.state ? { state: after.state } : {}),
        error: result.error ?? 'step_failed',
        failedStep: step.description,
      }
    }
  }
  const after = await recordSkillSuccess(skill.id)
  ctx.ledger?.log(
    'SkillExecuted',
    { id: skill.id, ok: true, completedSteps: total },
    { actor: 'skill' },
  )
  return {
    ok: true,
    completedSteps: total,
    totalSteps: total,
    ...(after?.state ? { state: after.state } : {}),
  }
}
