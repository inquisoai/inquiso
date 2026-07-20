import { hasToolCall, type SystemModelMessage, ToolLoopAgent, type ToolSet } from 'ai'
import type { ActiveModel } from '@/core/providers/resolve'
import { buildStopConditions, DEFAULT_BUDGET, type Meter } from './budget'
import { instructionsFor } from './cache'
import {
  type RunCallOptionsInput as CallOpts,
  RunCallOptions,
  runContextInstructions,
} from './call-options'
import { guardedStep, OBSERVATION_TOOLS } from './phases'
import { makeRepair } from './repair'
import { compactStep } from './steps'
import { repeatedActionIs, uncertainStreakIs } from './stops'
import { AGENT_SYSTEM } from './system'

const REPEATED_CALLS = 3
const UNCERTAIN_STREAK = 3

const asMessages = (
  i: string | SystemModelMessage | SystemModelMessage[],
): SystemModelMessage[] => {
  if (typeof i === 'string') return [{ role: 'system', content: i }]
  return Array.isArray(i) ? i : [i]
}

/**
 * The browser agent: AI SDK ToolLoopAgent as the reasoning loop, with all
 * authority below it (policy gate → executor → verifier → ledger live inside
 * each tool's execute). Per-run context arrives as typed, SDK-validated call
 * options; `prepareCall` appends it as a second system message so the large
 * base instructions stay a stable, cacheable prefix.
 */
export function buildBrowserAgent(active: ActiveModel, tools: ToolSet, meter: Meter) {
  return new ToolLoopAgent<CallOpts, ToolSet>({
    id: 'inquiso-browser',
    model: active.model,
    instructions: instructionsFor(AGENT_SYSTEM, active.providerId),
    callOptionsSchema: RunCallOptions,
    prepareCall: ({ options, instructions, ...rest }) => {
      const base = asMessages(instructions ?? '')
      const extra = options ? runContextInstructions(options) : undefined
      return {
        ...rest,
        instructions: extra ? [...base, { role: 'system' as const, content: extra }] : base,
      }
    },
    ...(active.providerOptions ? { providerOptions: active.providerOptions } : {}),
    tools,
    stopWhen: [
      ...buildStopConditions(DEFAULT_BUDGET, meter),
      repeatedActionIs(REPEATED_CALLS),
      uncertainStreakIs(UNCERTAIN_STREAK),
      // Deterministic completion: the model declares done via the
      // evidence-citing completeTask tool, not by trailing off in text.
      hasToolCall('completeTask'),
    ],
    prepareStep: guardedStep(
      compactStep,
      OBSERVATION_TOOLS.filter((t) => t in tools),
    ),
    experimental_repairToolCall: makeRepair(active.model),
  })
}
