import { stepCheckpoint } from '@/core/memory/checkpoint/service'
import type { RunLedger } from '@/core/memory/ledger/run-ledger'
import { ActionEvidence } from '@/shared/memory/evidence'
import type { ToolContext, ToolDef } from '../tools/context'

export interface ActArgs {
  handle?: string
  text?: string
  value?: string
}

export const argsOf = (args: unknown): ActArgs =>
  (args && typeof args === 'object' ? args : {}) as ActArgs

export const okOf = (result: unknown): { ok: boolean; error?: string } => {
  const r = result as { ok?: boolean; error?: string } | null
  return { ok: r?.ok ?? true, ...(r?.error ? { error: r.error } : {}) }
}

/** What the field should hold afterwards. The typed text itself is *not*
 * logged as an event payload (it may be sensitive) — only compared. */
export const expectedValue = (tool: string, a: ActArgs): string | undefined =>
  tool === 'type' ? a.text : tool === 'selectOption' ? a.value : undefined

/** Ledger-logged execution for tools without snapshot verification. */
export async function runPlain(
  def: ToolDef,
  args: unknown,
  ctx: ToolContext,
  ledger: RunLedger,
  toolCallId?: string,
): Promise<unknown> {
  const call = toolCallId ? { toolCallId } : {}
  ledger.log('ActionStarted', { tool: def.name, ...call })
  try {
    const result = await def.execute(args, ctx)
    const { ok, error } = okOf(result)
    ledger.log(ok ? 'ActionSucceeded' : 'ActionFailed', {
      tool: def.name,
      ...call,
      ...(error ? { error } : {}),
    })
    // Tools that observe their own outcome (e.g. downloads: the browser
    // accepted the request) self-report typed evidence — validated, then
    // ledgered as a verified outcome like snapshot-verified actions.
    const evidence = ActionEvidence.array().safeParse(
      (result as { evidence?: unknown } | null)?.evidence,
    )
    if (ok && evidence.success && evidence.data.length > 0) {
      ledger.log(
        'OutcomeVerified',
        { tool: def.name, ...call, outcome: 'verified_success' },
        { evidence: evidence.data },
      )
      void stepCheckpoint(ledger.taskId, {
        lastSeq: ledger.seq(),
        lastAction: def.name,
        completedStep: `${def.name} verified (self-reported evidence)`,
      })
    }
    return result
  } catch (e) {
    ledger.log('ActionFailed', { tool: def.name, ...call, error: String(e).slice(0, 300) })
    throw e
  }
}
