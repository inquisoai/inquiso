import type { LedgerEvent } from '@/shared/memory/events'
import type { ElementLocator } from '@/shared/memory/locator'
import type { SkillStep } from '@/shared/memory/skill'
import { slugify } from '@/shared/util/slug'

const ACTIONS = new Set(['navigate', 'click', 'type', 'selectOption', 'submitForm'])

export interface NormalizedTrajectory {
  steps: SkillStep[]
  inputs: { name: string; description: string }[]
}

const locatorOf = (name: string, role: string): ElementLocator => ({
  ...(role ? { role } : {}),
  ...(name ? { accessibleName: name, visibleText: name } : {}),
  semanticDescription: `the "${name || 'unnamed'}" ${role || 'element'}`,
})

const isVerified = (e: LedgerEvent | undefined): e is LedgerEvent =>
  e?.type === 'OutcomeVerified' && e.payload.outcome === 'verified_success'

/** The verdict belonging to the action at index `i` — the scan stops at the
 * next action boundary so a failed action can never borrow its successor's
 * success verdict. */
function verdictFor(events: LedgerEvent[], i: number): LedgerEvent | undefined {
  for (const n of events.slice(i + 1)) {
    if (n.type === 'ActionStarted' || n.type === 'ActionFailed') return undefined
    if (n.type === 'OutcomeVerified' || n.type === 'OutcomeUncertain') return n
  }
  return undefined
}

function navigateStep(verdict: LedgerEvent): SkillStep | null {
  const to = verdict.evidence?.find((ev) => ev.type === 'url_changed')
  const url = to?.type === 'url_changed' ? to.to : (verdict.page?.url ?? '')
  return url ? { action: 'navigate', url, description: `Navigate to ${url}` } : null
}

/** A verified action event → one semantic step. Typed/selected values become
 * `{{input}}` parameters *always*: the ledger never carried them (they may be
 * sensitive), so a workflow's variable data must come fresh each run. */
function stepFrom(
  e: LedgerEvent,
  verdict: LedgerEvent,
  inputs: Map<string, string>,
): SkillStep | null {
  const tool = String(e.payload.tool) as SkillStep['action']
  if (tool === 'navigate') return navigateStep(verdict)
  const name = String(e.payload.name ?? '')
  const locator = locatorOf(name, String(e.payload.role ?? ''))
  if (tool === 'type' || tool === 'selectOption') {
    const input = slugify(name) || `value-${inputs.size + 1}`
    inputs.set(input, `Value for the "${name || input}" field`)
    return {
      action: tool,
      locator,
      value: `{{${input}}}`,
      description: `${tool === 'type' ? 'Fill' : 'Select in'} ${locator.semanticDescription} with {{${input}}}`,
    }
  }
  return {
    action: tool,
    locator,
    description: `${tool === 'click' ? 'Click' : 'Submit via'} ${locator.semanticDescription}`,
  }
}

/** Trajectory normalization: raw verified ledger events → semantic,
 * replayable steps. Unverified/uncertain actions never enter a skill. */
export function normalizeTrajectory(events: LedgerEvent[]): NormalizedTrajectory {
  const steps: SkillStep[] = []
  const inputs = new Map<string, string>()
  events.forEach((e, i) => {
    if (e.type !== 'ActionStarted' || !ACTIONS.has(String(e.payload.tool))) return
    const verdict = verdictFor(events, i)
    if (!isVerified(verdict)) return
    const step = stepFrom(e, verdict, inputs)
    if (step) steps.push(step)
  })
  return {
    steps,
    inputs: [...inputs.entries()].map(([name, description]) => ({ name, description })),
  }
}

/** `{{placeholders}}` in a template, resolved from the provided inputs. */
export function substitute(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([\w-]+)\}\}/g, (_, key: string) => values[key] ?? `{{${key}}}`)
}
