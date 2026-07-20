import type { StepResult, StopCondition, ToolSet } from 'ai'

/**
 * Loop-health stop conditions, added to the budget caps (steps, wall-clock,
 * tokens). A run must not be allowed to burn its whole budget re-issuing the
 * same call or piling up unverifiable outcomes (docs/memory-agent).
 */

const callSignature = (step: StepResult<ToolSet>): string =>
  step.toolCalls.map((c) => `${c.toolName}:${JSON.stringify(c.input)}`).join('|')

/** Stops when the model issued the exact same tool call(s) (name + input) in
 * each of the last `n` steps — a stuck loop. */
export function repeatedActionIs(n: number): StopCondition<ToolSet> {
  return ({ steps }) => {
    if (steps.length < n) return false
    const signatures = steps.slice(-n).map(callSignature)
    return signatures[0] !== '' && signatures.every((s) => s === signatures[0])
  }
}

const allUncertain = (step: StepResult<ToolSet>): boolean =>
  step.toolResults.length > 0 &&
  step.toolResults.every(
    (r) =>
      (r.output as { verification?: { outcome?: string } } | null)?.verification?.outcome ===
      'uncertain',
  )

/** Stops after `n` consecutive steps whose verified-tool results were all
 * uncertain — the agent is acting without evidence anything is happening. */
export function uncertainStreakIs(n: number): StopCondition<ToolSet> {
  return ({ steps }) => steps.length >= n && steps.slice(-n).every(allUncertain)
}
