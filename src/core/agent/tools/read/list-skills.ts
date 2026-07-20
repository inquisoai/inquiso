import { z } from 'zod'
import { tabOrigin } from '@/core/context/tab'
import { allSkills } from '@/core/memory/skills/store'
import { SUGGESTIBLE_STATES } from '@/shared/memory/skill'
import { defineTool } from '../context'

/**
 * Skill discovery (cookbook progressive-disclosure phase 1): compact metadata
 * of live learned workflows so the model can find one even when retrieval's
 * goal matching didn't surface it. Full definitions load via loadBrowserSkill.
 */
export const listBrowserSkills = defineTool({
  name: 'listBrowserSkills',
  description:
    'List learned workflows (name, id, state, reliability) for the current site — or all ' +
    'sites with allOrigins. Call loadBrowserSkill with an id for the full steps.',
  risk: 'none',
  inputSchema: z.object({ allOrigins: z.boolean().default(false) }),
  execute: async ({ allOrigins }, ctx) => {
    const origin = allOrigins ? undefined : await tabOrigin(ctx.tabId)
    const all = await allSkills()
    const superseded = new Set(all.map((s) => s.previousVersionId).filter(Boolean))
    const skills = all
      .filter((s) => SUGGESTIBLE_STATES.includes(s.state) && !superseded.has(s.id))
      .filter((s) => !origin || s.origins.includes(origin))
      .slice(0, 20)
      .map((s) => ({
        id: s.id,
        name: s.name,
        state: s.state,
        origins: s.origins,
        reliability: `${s.reliability.successCount}✓/${s.reliability.failureCount}✕`,
        goalPattern: s.goalPattern,
      }))
    return { skills }
  },
})
