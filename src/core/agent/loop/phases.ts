import type { ModelMessage, StepResult, ToolSet } from 'ai'

type StepOptions = { stepNumber: number; messages: ModelMessage[]; steps: StepResult<ToolSet>[] }
type StepPatch = { messages?: ModelMessage[]; activeTools?: string[] }
type BaseStep = (opts: { stepNumber: number; messages: ModelMessage[] }) => StepPatch

/** Read-only tools the model may use while re-observing (must exist in the
 * run's toolset; buildBrowserAgent intersects before use). */
export const OBSERVATION_TOOLS = [
  'readPage',
  'queryElements',
  'getMetadata',
  'getSelection',
  'listLinks',
  'readTables',
  'getTabs',
  'readTab',
  'screenshot',
  'waitFor',
  'recall',
  'loadBrowserSkill',
  'completeTask',
]

const allUncertain = (step: StepResult<ToolSet> | undefined): boolean =>
  !!step &&
  step.toolResults.length > 0 &&
  step.toolResults.every(
    (r) =>
      (r.output as { verification?: { outcome?: string } } | null)?.verification?.outcome ===
      'uncertain',
  )

/**
 * prepareStep wrapper: context compaction always (the base step), plus forced
 * re-observation — when every verified action in the previous step came back
 * `uncertain`, the next step is restricted to observation tools so the model
 * must look at the page before acting again (docs/memory-agent §3.4: uncertain
 * is never success; migration plan §6).
 */
export function guardedStep(base: BaseStep, observationTools: string[]) {
  return (opts: StepOptions): StepPatch => {
    const patch = base({ stepNumber: opts.stepNumber, messages: opts.messages })
    if (allUncertain(opts.steps.at(-1))) {
      return { ...patch, activeTools: observationTools }
    }
    return patch
  }
}
