import { z } from 'zod'
import { tabOrigin } from '@/core/context/tab'
import { executeSkill } from '@/core/memory/skills/execute'
import { getSkill } from '@/core/memory/skills/store'
import { EXECUTABLE_STATES } from '@/shared/memory/skill'
import { defineTool } from '../context'

/**
 * Executes a learned workflow. The wrapper itself is low-risk because it adds
 * no authority: every replayed step passes the normal per-tool confirmation
 * gate and outcome verifier. Only verified/trusted skills run — shadow skills
 * are advisory, degraded ones must be repaired first (docs/memory-agent).
 */
export const runSkill = defineTool({
  name: 'runSkill',
  description:
    'Run a learned browser workflow by id with its required inputs. Only workflows the system ' +
    'has verified (or the user trusts) execute; each step still asks for confirmation like a ' +
    'normal action. Fails fast with a reason if preconditions do not hold.',
  risk: 'low',
  inputSchema: z.object({
    skillId: z.string(),
    inputs: z.record(z.string(), z.string()).default({}),
  }),
  execute: async ({ skillId, inputs }, ctx) => {
    const skill = await getSkill(skillId)
    if (!skill) return { ok: false, error: 'skill_not_found' }
    if (!EXECUTABLE_STATES.includes(skill.state)) {
      return {
        ok: false,
        error: 'skill_not_executable',
        state: skill.state,
        hint:
          skill.state === 'shadow' || skill.state === 'draft'
            ? 'Follow its steps yourself; matching runs will promote it.'
            : 'The workflow is degraded/retired — plan the task with general reasoning.',
      }
    }
    const origin = await tabOrigin(ctx.tabId)
    if (!origin || !skill.origins.includes(origin)) {
      return {
        ok: false,
        error: 'precondition_failed',
        detail: `expected origin ${skill.origins[0]}`,
      }
    }
    const missing = skill.inputs.filter((i) => !inputs[i.name]).map((i) => i.name)
    if (missing.length > 0) {
      return { ok: false, error: 'missing_inputs', missing }
    }
    return executeSkill(skill, inputs, ctx)
  },
})
