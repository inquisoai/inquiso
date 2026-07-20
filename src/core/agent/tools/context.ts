import type { LanguageModel } from 'ai'
import type { z } from 'zod'
import type { RunLedger } from '@/core/memory/ledger/run-ledger'
import type { Autonomy } from '../autonomy'
import type { Confirm } from '../types'

/** Risk levels drive the confirmation gate. medium/high always confirm. */
export type Risk = 'none' | 'low' | 'medium' | 'high'

/** A multimodal tool result the model can see (e.g. a screenshot). Structurally
 * a subset of the AI SDK's ToolResultOutput 'content' shape. */
export type ModelOutputPart =
  | { type: 'text'; text: string }
  | { type: 'image-data'; data: string; mediaType: string }
export type ToolModelOutput = { type: 'content'; value: ModelOutputPart[] }

/** Everything a tool's execute() may need. Passed by the registry, not by the
 * model — tools never receive anything the model can forge. */
export interface ToolContext {
  tabId: number
  confirm: Confirm
  /** The active model, for subagents that spawn a nested run. */
  model: LanguageModel
  /** How hands-off this run is. Set once from the request, never the model. */
  autonomy: Autonomy
  /** Whether the active model can see images (gates the screenshot tool). */
  vision: boolean
  /** Typed event recorder for this run; absent in bare (e.g. subagent) runs. */
  ledger?: RunLedger
}

/** A registered tool: metadata + risk + schema + handler, all in one place so
 * risk can never drift from behaviour. The registry applies the risk gate. */
export interface ToolDef {
  name: string
  description: string
  risk: Risk
  inputSchema: z.ZodTypeAny
  /** Forces confirmation regardless of autonomy (e.g. cross-origin navigate).
   * The un-overridable floor for context-dependent irreversibility. */
  confirmWhen?: (args: unknown) => boolean
  /** Excludes the tool from a run when it returns false (e.g. a vision tool on
   * a text-only model). Absent = always available. */
  available?: (ctx: ToolContext) => boolean
  /** Maps the raw result to what the model sees — used to hand the model an
   * image (screenshot) while the app keeps the full data. */
  toModelOutput?: (output: unknown) => ToolModelOutput
  execute: (args: unknown, ctx: ToolContext) => Promise<unknown>
}

/**
 * Authoring helper: keeps full type inference from the Zod schema to the
 * handler while erasing to the registry's uniform ToolDef. Define a tool with
 * this, then add it to the registry — nothing else to wire.
 */
export function defineTool<S extends z.ZodTypeAny>(def: {
  name: string
  description: string
  risk: Risk
  inputSchema: S
  confirmWhen?: (args: z.infer<S>) => boolean
  available?: (ctx: ToolContext) => boolean
  toModelOutput?: (output: unknown) => ToolModelOutput
  execute: (args: z.infer<S>, ctx: ToolContext) => Promise<unknown>
}): ToolDef {
  return def as unknown as ToolDef
}
