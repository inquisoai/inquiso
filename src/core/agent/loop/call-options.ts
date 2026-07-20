import { z } from 'zod'

export const EXECUTION_MODES = ['normal', 'recovery'] as const

/**
 * Typed, runtime-validated per-run context for the browser agent — the
 * ToolLoopAgent `callOptionsSchema` (validated by the SDK on every call).
 * Prompt-side context only: the compact rendered memory bundle and resume
 * note, never the memory database. Execution state (ledger, checkpoints,
 * policy) stays below the loop in deterministic Inquiso components.
 */
export const RunCallOptions = z.object({
  taskId: z.string(),
  runId: z.string(),
  origin: z.string().optional(),
  executionMode: z.enum(EXECUTION_MODES).default('normal'),
  /** Rendered `<memories>` block from retrieval (compact, trust-labeled). */
  memory: z.string().max(8000).optional(),
  /** Resume note from an interrupted checkpoint. */
  resume: z.string().max(2000).optional(),
})
export type RunCallOptions = z.infer<typeof RunCallOptions>
/** Pre-validation shape (defaults still optional) — the agent's CALL_OPTIONS
 * generic, since callers may rely on the schema to fill defaults. */
export type RunCallOptionsInput = z.input<typeof RunCallOptions>

const MODE_NOTES: Partial<Record<(typeof EXECUTION_MODES)[number], string>> = {
  recovery:
    'Execution mode: recovery — a previous attempt failed. Re-observe the page before acting and verify each step.',
}

/**
 * The per-run system addition composed from validated call options; undefined
 * when there is nothing to inject (a fresh profile adds zero overhead).
 */
export function runContextInstructions(opts: RunCallOptionsInput): string | undefined {
  const mode = opts.executionMode ? MODE_NOTES[opts.executionMode] : undefined
  const parts = [opts.memory, opts.resume, mode].filter((p): p is string => Boolean(p))
  return parts.length > 0 ? parts.join('\n\n') : undefined
}
