import { stepCheckpoint } from '@/core/memory/checkpoint/service'
import { toPageRef } from '@/shared/memory/events'
import type { ToolContext, ToolDef } from '../tools/context'
import { classify, type Verification } from './classify'
import { argsOf, expectedValue, okOf, runPlain } from './exec'
import { type ActionSnapshot, takeSnapshot } from './snapshot'

/** Act tools whose outcomes are evidence-verified with before/after snapshots. */
const VERIFIED = new Set(['click', 'type', 'navigate', 'selectOption', 'submitForm'])

/** Grace for the page to react (SPA route swap, form state) before the
 * after-snapshot; a missed late change classifies as uncertain, not success. */
const SETTLE_MS = 400
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

function verdictOf(
  def: ToolDef,
  args: unknown,
  result: unknown,
  before: ActionSnapshot,
  after: ActionSnapshot,
): Verification {
  const { ok, error } = okOf(result)
  const expected = expectedValue(def.name, argsOf(args))
  return classify({
    tool: def.name,
    ok,
    ...(error ? { error } : {}),
    before,
    after,
    ...(expected !== undefined ? { expectedValue: expected } : {}),
  })
}

/**
 * Executes a tool with ledger recording and, for page-mutating tools,
 * evidence-based outcome verification. Verification is deterministic and
 * separate from the planner; the result the model sees carries the verdict.
 */
export async function runLogged(
  def: ToolDef,
  args: unknown,
  ctx: ToolContext,
  toolCallId?: string,
): Promise<unknown> {
  const ledger = ctx.ledger
  if (!ledger) return def.execute(args, ctx)
  if (!VERIFIED.has(def.name)) return runPlain(def, args, ctx, ledger, toolCallId)

  const call = toolCallId ? { toolCallId } : {}
  const handle = argsOf(args).handle
  const before = await takeSnapshot(ctx.tabId, handle)
  ledger.log('ActionStarted', {
    tool: def.name,
    ...call,
    ...(handle ? { handle } : {}),
    ...(before.element?.name ? { name: before.element.name } : {}),
    ...(before.element?.role ? { role: before.element.role } : {}),
  })
  const result = await def.execute(args, ctx)
  await sleep(SETTLE_MS)
  const after = await takeSnapshot(ctx.tabId, handle)
  const verification = verdictOf(def, args, result, before, after)

  const { ok, error } = okOf(result)
  const page = after.page ? toPageRef(after.page.url, after.page.title) : undefined
  const pageExtra = page ? { page } : {}
  ledger.log(
    ok ? 'ActionSucceeded' : 'ActionFailed',
    { tool: def.name, ...call, ...(error ? { error } : {}) },
    pageExtra,
  )
  ledger.log(
    verification.outcome === 'uncertain' ? 'OutcomeUncertain' : 'OutcomeVerified',
    { tool: def.name, ...call, outcome: verification.outcome },
    { evidence: verification.evidence, ...pageExtra },
  )
  if (verification.outcome === 'verified_success') {
    void stepCheckpoint(ledger.taskId, {
      lastSeq: ledger.seq(),
      lastAction: def.name,
      ...pageExtra,
      completedStep: `${def.name} verified on ${page?.url ?? 'page'}`,
    })
  }
  return result && typeof result === 'object' ? { ...result, verification } : result
}
