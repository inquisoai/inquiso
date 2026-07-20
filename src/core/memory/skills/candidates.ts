import type { LedgerEvent, RunMeta } from '@/shared/memory/events'
import { newId } from '@/shared/memory/ids'
import { BrowserSkill, type SkillState } from '@/shared/memory/skill'
import { normalizeTrajectory } from './normalize'

const MIN_STEPS = 2

const successCriteria = (events: LedgerEvent[]): string[] => {
  const kinds = new Set<string>()
  for (const e of events) {
    if (e.type !== 'OutcomeVerified') continue
    for (const ev of e.evidence ?? []) kinds.add(ev.type)
  }
  return [...kinds].map((k) => `evidence: ${k}`)
}

/**
 * Skill candidate from a verified run: normalized steps, extracted inputs,
 * derived preconditions and success criteria. Returns null when the
 * trajectory is too thin to be worth reusing — one uncertain task never
 * auto-promotes into a skill.
 */
export function skillFromRun(
  meta: RunMeta,
  events: LedgerEvent[],
  opts: { state: SkillState; version?: number; previousVersionId?: string } = { state: 'draft' },
): BrowserSkill | null {
  const origin = meta.origins[0]
  if (!origin || meta.outcome !== 'completed') return null
  const { steps, inputs } = normalizeTrajectory(events)
  if (steps.length < MIN_STEPS) return null
  const now = Date.now()
  return BrowserSkill.parse({
    id: newId('skill'),
    name: meta.goal.slice(0, 120),
    description: `Learned workflow for: ${meta.goal}`.slice(0, 500),
    version: opts.version ?? 1,
    origins: meta.origins,
    urlPatterns: events.find((e) => e.page?.url)?.page?.url
      ? [String(events.find((e) => e.page?.url)?.page?.url)]
      : [],
    goalPattern: meta.goal.slice(0, 300),
    preconditions: [
      `The active tab is on ${origin}`,
      ...inputs.map((i) => `Input "${i.name}" is provided`),
    ],
    inputs,
    steps,
    successCriteria: successCriteria(events),
    capabilities: [...new Set(steps.map((s) => s.action))],
    state: opts.state,
    reliability: { successCount: 0, failureCount: 0, consecutiveFailures: 0 },
    learnedFrom: { runIds: [meta.runId], episodeIds: [] },
    ...(opts.previousVersionId ? { previousVersionId: opts.previousVersionId } : {}),
    createdAt: now,
    updatedAt: now,
  })
}
