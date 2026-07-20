import type { MemoryBundle } from '@/core/memory/retrieval/bundle'
import { recordSkillFailure } from '@/core/memory/skills/reliability'
import { EXECUTABLE_STATES } from '@/shared/memory/skill'
import type { SimBrowser } from './portal-sim'

export interface PlanResult {
  completed: boolean
  /** Planning rounds: initial plan + one per observe/replan cycle. Held to a
   * fixed deterministic policy so config differences are the memory system's. */
  modelCalls: number
}

const EXPLORE_ORDER = ['Reports', 'Settings', 'Account']

/**
 * Scripted planner with constant competence across configurations:
 *   1. an offered workflow's steps are followed directly (1 planning call);
 *      executable-skill step failures hit the real reliability path;
 *   2. else a site fact naming the billing location is used (2 calls);
 *   3. else explore navigation candidates in a fixed order, one replanning
 *      call per wrong page — the "first session" cost the memory system
 *      is supposed to remove.
 */
/** Follows a workflow's steps; a dead element hits the real reliability path
 * (for executable skills) exactly as executeSkill would. */
async function followSkill(browser: SimBrowser, skill: NonNullable<MemoryBundle['skills'][0]>) {
  for (const step of skill.steps) {
    if (step.action !== 'click' || !step.locator?.accessibleName) continue
    if (step.locator.accessibleName === 'Download newest PDF') continue
    if (!browser.click(step.locator.accessibleName)) {
      if (EXECUTABLE_STATES.includes(skill.state)) {
        await recordSkillFailure(skill.id, `${step.description}: element_not_found`)
      }
      return 'broke' as const
    }
  }
  return 'done' as const
}

/** Try one navigation entry, then Billing from there. */
function tryPath(browser: SimBrowser, via: string): boolean {
  if (browser.path !== '/') browser.click('Home')
  if (!browser.click(via)) return false
  return browser.click('Billing') && browser.path === '/billing'
}

/** Fixed-order exploration — the cost memory is supposed to remove. Each
 * candidate page costs one observe/decide planning round. */
function explore(browser: SimBrowser): number {
  let calls = 0
  for (const candidate of EXPLORE_ORDER) {
    if (browser.path !== '/') browser.click('Home')
    if (!browser.click(candidate)) continue
    calls += 1
    if (browser.click('Billing') && browser.path === '/billing') return calls
  }
  return calls
}

export async function runInvoiceTask(
  browser: SimBrowser,
  bundle: MemoryBundle | null,
): Promise<PlanResult> {
  let modelCalls = 1

  const finish = (): PlanResult => ({ completed: browser.click('Download newest PDF'), modelCalls })

  const skill = bundle?.skills[0]
  if (skill) {
    const outcome = await followSkill(browser, skill)
    if (outcome === 'broke')
      modelCalls += 1 // replan after the workflow broke
    else if (browser.path === '/billing') return finish()
  }

  const fact = bundle?.siteFacts.find((m) => m.slotKey === 'billing-location')
  if (fact && browser.path !== '/billing') {
    modelCalls += 1 // read the remembered location into a concrete plan
    if (tryPath(browser, fact.summary.includes('Settings') ? 'Settings' : 'Account')) {
      return finish()
    }
    modelCalls += 1 // remembered path is stale — fall back to exploring
  }

  modelCalls += explore(browser)
  return browser.path === '/billing' ? finish() : { completed: false, modelCalls }
}
