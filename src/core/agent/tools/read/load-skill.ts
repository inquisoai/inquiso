import { z } from 'zod'
import { getSkill } from '@/core/memory/skills/store'
import { defineTool } from '../context'

/**
 * Progressive disclosure for learned workflows: retrieval offers only compact
 * skill metadata (id, name, state, reliability); the full steps,
 * preconditions, inputs, and success criteria load only when the model
 * actually selects the skill — keeping the prompt small until knowledge is
 * needed (docs/memory-agent/browser-skills.md).
 */
export const loadBrowserSkill = defineTool({
  name: 'loadBrowserSkill',
  description:
    'Load the full definition of a learned workflow by id (steps, preconditions, required ' +
    'inputs, success criteria). Call this before following or running a workflow offered in ' +
    'the memory context.',
  risk: 'none',
  inputSchema: z.object({ skillId: z.string() }),
  execute: async ({ skillId }) => {
    const skill = await getSkill(skillId)
    if (!skill) return { ok: false, error: 'skill_not_found' }
    return {
      ok: true,
      id: skill.id,
      name: skill.name,
      version: skill.version,
      state: skill.state,
      origins: skill.origins,
      preconditions: skill.preconditions,
      inputs: skill.inputs,
      steps: skill.steps.map((s) => s.description),
      successCriteria: skill.successCriteria,
      reliability: skill.reliability,
      executable: skill.state === 'verified' || skill.state === 'trusted',
    }
  },
})
