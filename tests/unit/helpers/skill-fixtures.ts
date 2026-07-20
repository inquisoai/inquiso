import { LedgerEvent, RunMeta } from '@/shared/memory/events'
import { BrowserSkill } from '@/shared/memory/skill'

/** Shared builders for skill-engine tests. */

export const testSkill = (over: Record<string, unknown> = {}): BrowserSkill =>
  BrowserSkill.parse({
    id: `skill_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Download newest invoice',
    description: 'Learned workflow',
    version: 1,
    origins: ['https://portal.test'],
    goalPattern: 'download the newest invoice',
    steps: [
      {
        action: 'navigate',
        url: 'https://portal.test/billing',
        description: 'Navigate to https://portal.test/billing',
      },
      {
        action: 'click',
        description: 'Click the "Download" button',
        locator: {
          accessibleName: 'Download',
          role: 'button',
          semanticDescription: 'the "Download" button',
        },
      },
    ],
    state: 'shadow',
    reliability: { successCount: 0, failureCount: 0, consecutiveFailures: 0 },
    learnedFrom: { runIds: ['run_1'], episodeIds: [] },
    createdAt: 1,
    updatedAt: 1,
    ...over,
  })

export const testMeta = (over: Record<string, unknown> = {}): RunMeta =>
  RunMeta.parse({
    taskId: 't',
    runId: 'r9',
    goal: 'download the newest invoice',
    startedAt: 1,
    outcome: 'completed',
    metrics: { actions: 3, failures: 0, recoveries: 0, modelCalls: 3, tokens: 100 },
    origins: ['https://portal.test'],
    ...over,
  })

let seq = 0
export const testEvent = (
  type: string,
  payload: Record<string, unknown>,
  evidence?: unknown[],
): LedgerEvent =>
  LedgerEvent.parse({
    id: `evt_${++seq}`,
    taskId: 't',
    runId: 'r9',
    seq,
    at: seq,
    actor: 'agent',
    type,
    payload,
    ...(evidence ? { evidence } : {}),
    page: { url: 'https://portal.test/billing' },
  })

/** A verified navigate→click trajectory on the portal. */
export const verifiedTrajectory = (): LedgerEvent[] => [
  testEvent('ActionStarted', { tool: 'navigate' }),
  testEvent('OutcomeVerified', { tool: 'navigate', outcome: 'verified_success' }, [
    { type: 'url_changed', from: 'https://portal.test/', to: 'https://portal.test/billing' },
  ]),
  testEvent('ActionStarted', { tool: 'click', name: 'Download', role: 'button' }),
  testEvent('OutcomeVerified', { tool: 'click', outcome: 'verified_success' }),
]
