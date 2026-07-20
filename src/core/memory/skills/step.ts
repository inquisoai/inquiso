import type { ToolContext } from '@/core/agent/tools/context'
import { sendToTab } from '@/core/context/tab'
import type { ElementHandle } from '@/shared/content-actions'
import type { ElementLocator } from '@/shared/memory/locator'
import type { SkillStep } from '@/shared/memory/skill'
import { substitute } from './normalize'

/** Locator ladder: role+name → name/visible text → CSS fallback. The first
 * layer that resolves a live element wins; nothing falls back silently. */
export async function resolveHandle(
  ctx: ToolContext,
  locator: ElementLocator,
): Promise<string | null> {
  const attempts = [
    { role: locator.role, text: locator.accessibleName },
    { text: locator.accessibleName ?? locator.visibleText },
    ...(locator.cssFallback ? [{ selector: locator.cssFallback }] : []),
  ]
  for (const args of attempts) {
    if (!args.text && !('selector' in args)) continue
    try {
      const found = await sendToTab<ElementHandle[]>(ctx.tabId, { type: 'query', args })
      if (found[0]) return found[0].id
    } catch {
      return null
    }
  }
  return null
}

const verifiedOk = (result: unknown): boolean => {
  const r = result as { ok?: boolean; verification?: { outcome?: string } } | null
  return r?.ok !== false && r?.verification?.outcome !== 'verified_failure'
}

/** The tool arguments a step resolves to, or an error when its element is gone. */
async function stepArgs(
  step: SkillStep,
  inputs: Record<string, string>,
  ctx: ToolContext,
): Promise<{ args?: Record<string, unknown>; error?: string }> {
  if (step.action === 'navigate') return { args: { to: substitute(step.url ?? '', inputs) } }
  const handle = step.locator ? await resolveHandle(ctx, step.locator) : null
  if (!handle) return { error: 'element_not_found' }
  const value = step.value ? substitute(step.value, inputs) : undefined
  if (step.action === 'type') return { args: { handle, text: value ?? '' } }
  if (step.action === 'selectOption') return { args: { handle, value: value ?? '' } }
  return { args: { handle } }
}

/** Replays one step through the same gate + verifier as model actions. */
export async function runStep(
  step: SkillStep,
  inputs: Record<string, string>,
  ctx: ToolContext,
): Promise<{ ok: boolean; error?: string }> {
  // Lazy import: the registry pulls in the whole tool tree; loading it per
  // execution keeps module graphs cycle-free (skills ← agent ← skills).
  const { gatedExecute, getToolDef } = await import('@/core/agent/tools/registry')
  const def = getToolDef(step.action)
  if (!def) return { ok: false, error: `unknown_action_${step.action}` }
  const { args, error } = await stepArgs(step, inputs, ctx)
  if (!args) return { ok: false, error: error ?? 'unresolvable_step' }
  const result = await gatedExecute(def, args, ctx)
  const r = result as { ok?: boolean; error?: string }
  return verifiedOk(result) ? { ok: true } : { ok: false, error: r?.error ?? 'verified_failure' }
}
