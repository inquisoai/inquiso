import { type StopCondition, stepCountIs, type ToolSet } from 'ai'
import type { AgentEmit } from '../types'

/** Caps on an autonomous run so it can't loop forever or run up a huge BYOK
 * bill. Emergency stop (AbortSignal) is separate and always available. */
export interface Budget {
  maxSteps: number
  deadlineMs: number
  maxTokens?: number
}

export const DEFAULT_BUDGET: Budget = { maxSteps: 30, deadlineMs: 5 * 60_000 }

/** Running tally fed by streamText's onStepFinish (see run-agent). */
export interface Meter {
  steps: number
  tokens: number
  startedAt: number
}

export const createMeter = (startedAt: number): Meter => ({ steps: 0, tokens: 0, startedAt })

/** onStepFinish handler: meters each step for the budget caps + live log. */
export function stepMeter(meter: Meter, emit: AgentEmit) {
  return ({ usage }: { usage?: { totalTokens?: number | undefined } | undefined }): void => {
    meter.steps += 1
    meter.tokens += usage?.totalTokens ?? 0
    emit({
      type: 'budget',
      steps: meter.steps,
      ms: Date.now() - meter.startedAt,
      tokens: meter.tokens,
    })
  }
}

/** Stop the loop when any cap is hit: step count, wall-clock, or (BYOK) tokens.
 * streamText's `stopWhen` accepts an array and stops when any returns true. */
export function buildStopConditions(budget: Budget, meter: Meter): StopCondition<ToolSet>[] {
  const conditions: StopCondition<ToolSet>[] = [
    stepCountIs(budget.maxSteps),
    () => Date.now() - meter.startedAt >= budget.deadlineMs,
  ]
  if (budget.maxTokens !== undefined) {
    const cap = budget.maxTokens
    conditions.push(() => meter.tokens >= cap)
  }
  return conditions
}
