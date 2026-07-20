import { describe, expect, it } from 'vitest'
import { normalizeTrajectory, substitute } from '@/core/memory/skills/normalize'
import { LedgerEvent } from '@/shared/memory/events'

let seq = 0
const evt = (type: string, payload: Record<string, unknown>, evidence?: unknown[]): LedgerEvent =>
  LedgerEvent.parse({
    id: `evt_${++seq}`,
    taskId: 't',
    runId: 'r',
    seq,
    at: seq,
    actor: 'agent',
    type,
    payload,
    ...(evidence ? { evidence } : {}),
    page: { url: 'https://portal.test/billing' },
  })

const trajectory = [
  evt('ActionStarted', { tool: 'navigate' }),
  evt('OutcomeVerified', { tool: 'navigate', outcome: 'verified_success' }, [
    { type: 'url_changed', from: 'https://portal.test/', to: 'https://portal.test/billing' },
  ]),
  evt('ActionStarted', { tool: 'click', handle: 'iq-1', name: 'Reports', role: 'link' }),
  evt('OutcomeVerified', { tool: 'click', outcome: 'verified_success' }),
  evt('ActionStarted', { tool: 'type', handle: 'iq-2', name: 'Report name', role: 'input' }),
  evt('OutcomeVerified', { tool: 'type', outcome: 'verified_success' }),
  evt('ActionStarted', { tool: 'click', handle: 'iq-3', name: 'Broken button', role: 'button' }),
  evt('OutcomeUncertain', { tool: 'click', outcome: 'uncertain' }),
]

describe('trajectory normalization', () => {
  it('a failed action never borrows the next action’s success verdict', () => {
    const { steps } = normalizeTrajectory([
      evt('ActionStarted', { tool: 'click', name: 'Settings', role: 'link' }),
      evt('ActionFailed', { tool: 'click', error: 'element_not_found' }),
      evt('ActionStarted', { tool: 'click', name: 'Account', role: 'link' }),
      evt('OutcomeVerified', { tool: 'click', outcome: 'verified_success' }),
    ])
    expect(steps.map((s) => s.locator?.accessibleName)).toEqual(['Account'])
  })

  it('turns verified events into semantic steps and drops unverified ones', () => {
    const { steps } = normalizeTrajectory(trajectory)
    expect(steps.map((s) => s.action)).toEqual(['navigate', 'click', 'type'])
    expect(steps[0]?.url).toBe('https://portal.test/billing')
    expect(steps[1]?.locator?.accessibleName).toBe('Reports')
    expect(steps[1]?.description).toBe('Click the "Reports" link')
  })

  it('typed values are always {{parameters}}, never remembered literals', () => {
    const { steps, inputs } = normalizeTrajectory(trajectory)
    const typeStep = steps.find((s) => s.action === 'type')
    expect(typeStep?.value).toBe('{{report-name}}')
    expect(inputs).toEqual([
      { name: 'report-name', description: 'Value for the "Report name" field' },
    ])
  })

  it('substitute resolves placeholders and leaves unknown ones visible', () => {
    expect(substitute('Fill with {{report-name}}', { 'report-name': 'June' })).toBe(
      'Fill with June',
    )
    expect(substitute('{{missing}}', {})).toBe('{{missing}}')
  })
})
