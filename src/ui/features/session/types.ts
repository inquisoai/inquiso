import type { Turn } from '@/shared/history'
import type { Source, TraceItem, UsedMemory } from '@/shared/trace'

// The trace/source/usage shapes are the persisted ones — a live turn and a
// reloaded turn are the same type.
export type { ReasoningItem, Source, ToolItem, TraceItem, TurnUsage } from '@/shared/trace'

/** A rendered turn — identical to the persisted Turn (trace/thinkMs/usage/
 * sources all survive a reload). */
export type DisplayTurn = Turn

export interface ConfirmReq {
  id: string
  tool: string
  args: unknown
}

/** Live run metering for the action log / budget line. */
export interface BudgetState {
  steps: number
  ms: number
  tokens: number
}

export interface SessionState {
  /** Completed turns of the current conversation (persisted background-side). */
  turns: DisplayTurn[]
  /** Live budget meter while a run is in flight; null when idle. */
  budget: BudgetState | null
  answer: string
  trace: TraceItem[]
  /** Sources collected during the live run, attached to the turn on done. */
  sources: Source[]
  /** Memories retrieved for the live run ("Using: …"), attached on done. */
  memories: UsedMemory[]
  status: string
  busy: boolean
  error: string | null
  confirms: ConfirmReq[]
}
