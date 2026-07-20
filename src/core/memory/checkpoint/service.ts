import { Checkpoint } from '@/shared/memory/checkpoint'
import type { PageRef } from '@/shared/memory/events'
import { getCheckpoint, removeCheckpoint, saveCheckpoint } from './store'

const MAX_STEPS = 30

/** Opens the resume point for a fresh run of this task. */
export async function startCheckpoint(taskId: string, runId: string, goal: string): Promise<void> {
  await saveCheckpoint(
    Checkpoint.parse({
      v: 1,
      taskId,
      runId,
      goal,
      status: 'active',
      lastSeq: 0,
      updatedAt: Date.now(),
    }),
  )
}

export interface StepPatch {
  lastSeq: number
  lastAction?: string
  page?: PageRef
  /** Human-readable note of a step that verifiably completed. */
  completedStep?: string
}

/** Advances the resume point after a (verified) action. */
export async function stepCheckpoint(taskId: string, patch: StepPatch): Promise<void> {
  const cp = await getCheckpoint(taskId)
  if (cp?.status !== 'active') return
  const steps = patch.completedStep
    ? [...cp.completedSteps, patch.completedStep].slice(-MAX_STEPS)
    : cp.completedSteps
  await saveCheckpoint({
    ...cp,
    lastSeq: patch.lastSeq,
    ...(patch.lastAction ? { lastAction: patch.lastAction } : {}),
    ...(patch.page ? { page: patch.page } : {}),
    completedSteps: steps,
    updatedAt: Date.now(),
  })
}

/** The task finished — the resume point is no longer needed (real delete). */
export async function finishCheckpoint(taskId: string): Promise<void> {
  await removeCheckpoint(taskId)
}

/** An 'active' checkpoint left by a *different* run means that run never
 * finished — worker death, browser restart, or a crash mid-task. */
export async function interruptedCheckpoint(
  taskId: string,
  currentRunId: string,
): Promise<Checkpoint | null> {
  const cp = await getCheckpoint(taskId)
  if (cp?.status !== 'active' || cp.runId === currentRunId) return null
  return cp
}

/** Resume instructions for the planner. Deliberately insists on revalidating
 * live browser state instead of trusting the checkpoint blindly. */
export function resumeNote(cp: Checkpoint): string {
  const parts = [
    `[task-resume] A previous run of this task was interrupted. Goal: ${cp.goal}.`,
    cp.completedSteps.length
      ? `Steps already verified complete: ${cp.completedSteps.join('; ')}.`
      : '',
    cp.page ? `The run was last on ${cp.page.url}.` : '',
    'The browser state may have changed since: re-observe the current page and verify what',
    'actually completed before continuing. Never repeat a side-effecting action that already',
    'verifiably succeeded.',
  ]
  return parts.filter(Boolean).join(' ')
}
