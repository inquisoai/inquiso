import { generateText, stepCountIs, type ToolSet, tool } from 'ai'
import { z } from 'zod'
import type { ToolContext } from '../tools/context'
import { comparer } from './comparer'
import { researcher } from './researcher'
import { trustAuditor } from './trust-auditor'
import type { SubagentDef } from './types'

/**
 * Every subagent, one convention. To add one: create a SubagentDef file and
 * add it here — it's exposed to the main agent as an `ask_<id>` tool with no
 * further wiring (docs/04).
 */
export const subagentDefs: SubagentDef[] = [researcher, trustAuditor, comparer]

const SUB_STEPS = 6

/** Builds the subagent's own tool subset from the registry, routed through the
 * SAME confirm gate as the main agent (toAiTool) — so a subagent can safely use
 * act tools. Imported lazily to break the import cycle with the registry. */
async function subagentTools(def: SubagentDef, ctx: ToolContext): Promise<ToolSet> {
  const { toolDefs, toAiTool } = await import('../tools/registry')
  const set: ToolSet = {}
  for (const t of toolDefs.filter((d) => def.toolNames.includes(d.name))) {
    set[t.name] = toAiTool(t, ctx)
  }
  return set
}

/** Exposes each subagent to the parent model as one delegation tool. Calling it
 * runs a focused nested turn and returns the result — a handoff, one level deep. */
export function buildSubagentTools(ctx: ToolContext): ToolSet {
  const set: ToolSet = {}
  for (const def of subagentDefs) {
    set[`ask_${def.id}`] = tool({
      description: def.description,
      inputSchema: z.object({ task: z.string().describe('The sub-question to delegate.') }),
      execute: async ({ task }) => {
        const { text } = await generateText({
          model: ctx.model,
          system: def.system,
          prompt: task,
          tools: await subagentTools(def, ctx),
          stopWhen: stepCountIs(SUB_STEPS),
        })
        return { result: text }
      },
    })
  }
  return set
}
