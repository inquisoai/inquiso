import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ToolContext, ToolDef } from '@/core/agent/tools/context'
import { runPlain } from '@/core/agent/verify/exec'
import { createRunLedger } from '@/core/memory/ledger/run-ledger'
import { dropRun, eventsForRun, listRuns } from '@/core/memory/ledger/store'

vi.mock('localforage', async () => (await import('../../../helpers/memdb')).localforageMock())

const ctx = {} as ToolContext

const tool = (result: unknown): ToolDef =>
  ({
    name: 'downloadFile',
    description: 'test',
    risk: 'high',
    inputSchema: {},
    execute: async () => result,
  }) as unknown as ToolDef

describe('self-reported outcome evidence (downloads)', () => {
  beforeEach(async () => {
    for (const run of await listRuns()) await dropRun(run.runId)
  })

  it('a download with evidence gets an OutcomeVerified ledger event', async () => {
    const ledger = createRunLedger('t1', 'run_dl', 'export the invoice')
    await runPlain(
      tool({
        ok: true,
        downloadId: 7,
        evidence: [{ type: 'download_started', filename: 'INV-023.pdf' }],
      }),
      {},
      ctx,
      ledger,
      'call-3',
    )
    await ledger.finalize('completed')
    const events = await eventsForRun('run_dl')
    const verified = events.find((e) => e.type === 'OutcomeVerified')
    expect(verified?.payload).toMatchObject({
      tool: 'downloadFile',
      toolCallId: 'call-3',
      outcome: 'verified_success',
    })
    expect(verified?.evidence).toEqual([{ type: 'download_started', filename: 'INV-023.pdf' }])
  })

  it('malformed or missing evidence never fabricates a verified outcome', async () => {
    const ledger = createRunLedger('t1', 'run_plain', 'goal')
    await runPlain(tool({ ok: true }), {}, ctx, ledger)
    await runPlain(tool({ ok: true, evidence: [{ type: 'vibes' }] }), {}, ctx, ledger)
    await runPlain(tool({ ok: false, evidence: [{ type: 'download_started' }] }), {}, ctx, ledger)
    await ledger.finalize('completed')
    const events = await eventsForRun('run_plain')
    expect(events.filter((e) => e.type === 'OutcomeVerified')).toHaveLength(0)
  })
})
