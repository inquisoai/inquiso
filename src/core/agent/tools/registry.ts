import { type ToolSet, tool } from 'ai'
import { tabOrigin } from '@/core/context/tab'
import { capabilityOf } from '@/core/policy/capabilities'
import { decidePolicy } from '@/core/policy/engine'
import { needsConfirm } from '../risk'
import { buildSubagentTools } from '../subagents/registry'
import { runLogged } from '../verify/run'
import { actTools } from './act'
import { browserTools } from './browser'
import type { Risk, ToolContext, ToolDef } from './context'
import { readTools } from './read'

/**
 * Every built-in tool, grouped by category. To add a tool: create a file in
 * tools/read (observation), tools/act (page interaction), or tools/browser
 * (browser-level) with defineTool(), then add it to that group's index. Risk,
 * schema, and the confirmation gate are handled by the registry (docs/04).
 */
export const toolDefs: ToolDef[] = [...readTools, ...actTools, ...browserTools]

const byName: Record<string, ToolDef> = Object.fromEntries(toolDefs.map((d) => [d.name, d]))

/** A tool's declared risk; unknown tools are treated as high (docs/05). */
export const riskOf = (name: string): Risk => byName[name]?.risk ?? 'high'

export const getToolDef = (name: string): ToolDef | undefined => byName[name]

/** The one execution path for every tool call — model-issued *or* skill-
 * replayed: deterministic policy first (deny wins; ALWAYS_ASK capabilities
 * ignore standing allows), then the risk × autonomy confirmation gate (a
 * `confirmWhen` floor forces it regardless), then ledger-logged,
 * outcome-verified execution. Memory never bypasses any layer. */
export async function gatedExecute(
  def: ToolDef,
  args: unknown,
  ctx: ToolContext,
  toolCallId?: string,
): Promise<unknown> {
  const capability = capabilityOf(def.name)
  const call = toolCallId ? { toolCallId } : {}
  const policy = await decidePolicy({ tool: def.name, origin: await tabOrigin(ctx.tabId) })
  if (policy === 'deny') {
    ctx.ledger?.log('PermissionDenied', { tool: def.name, capability, policy, ...call })
    return { ok: false, error: 'policy_denied' }
  }
  const forced = def.confirmWhen?.(args) ?? false
  const gateAsks = policy !== 'allow' && needsConfirm(def.name, ctx.autonomy)
  if (forced || policy === 'ask' || gateAsks) {
    ctx.ledger?.log('PermissionRequested', { tool: def.name, capability, policy, ...call })
    const approved = await ctx.confirm(def.name, args)
    ctx.ledger?.log(
      approved ? 'PermissionGranted' : 'PermissionDenied',
      { tool: def.name, capability, ...call },
      { actor: 'user' },
    )
    if (!approved) return { ok: false, error: 'user_rejected' }
  }
  return runLogged(def, args, ctx, toolCallId)
}

/** Wraps one ToolDef as an AI SDK tool over gatedExecute — so no tool can
 * forget the gate. */
export function toAiTool(def: ToolDef, ctx: ToolContext) {
  const toModel = def.toModelOutput
  return tool({
    description: def.description,
    inputSchema: def.inputSchema,
    ...(toModel ? { toModelOutput: ({ output }: { output: unknown }) => toModel(output) } : {}),
    // The SDK's toolCallId correlates this call with its policy, execution,
    // and verification events in the ledger.
    execute: (args: unknown, callOpts?: { toolCallId?: string }) =>
      gatedExecute(def, args, ctx, callOpts?.toolCallId),
  })
}

/** The full tool set for a run: registry tools (minus any a tool opts out of
 * for this run, e.g. a vision tool on a text-only model) + subagents. */
export function buildTools(ctx: ToolContext): ToolSet {
  const tools: ToolSet = {}
  for (const def of toolDefs) {
    if (def.available?.(ctx) ?? true) tools[def.name] = toAiTool(def, ctx)
  }
  return { ...tools, ...buildSubagentTools(ctx) }
}
