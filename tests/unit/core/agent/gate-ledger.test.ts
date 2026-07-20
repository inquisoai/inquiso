import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { defineTool, type ToolContext } from '@/core/agent/tools/context'
import { remember } from '@/core/agent/tools/read/memory'
import { gatedExecute } from '@/core/agent/tools/registry'
import { createRunLedger } from '@/core/memory/ledger/run-ledger'
import { dropRun, eventsForRun, listRuns } from '@/core/memory/ledger/store'

vi.mock('localforage', async () => (await import('../../helpers/memdb')).localforageMock())

const confirmed = defineTool({
  name: 'confirmedTool',
  description: 'always confirms',
  risk: 'none',
  confirmWhen: () => true,
  inputSchema: z.object({}),
  execute: async () => ({ ok: true }),
})

const ctx = (confirm: (tool: string, args: unknown) => Promise<boolean>): ToolContext =>
  ({ confirm, autonomy: 'scope' }) as unknown as ToolContext

describe('gatedExecute ledger correlation (SDK toolCallId)', () => {
  beforeEach(async () => {
    for (const run of await listRuns()) await dropRun(run.runId)
  })

  it('stamps the toolCallId on permission and action events of one call', async () => {
    const ledger = createRunLedger('t1', 'run_gate', 'goal')
    const result = await gatedExecute(confirmed, {}, { ...ctx(async () => true), ledger }, 'call-9')
    await ledger.finalize('completed')
    expect(result).toEqual({ ok: true })
    const events = await eventsForRun('run_gate')
    for (const type of ['PermissionRequested', 'PermissionGranted', 'ActionStarted']) {
      const event = events.find((e) => e.type === type)
      expect(event?.payload, type).toMatchObject({ toolCallId: 'call-9' })
    }
  })

  it('a declined confirm rejects the call before any action event', async () => {
    const ledger = createRunLedger('t1', 'run_reject', 'goal')
    const result = await gatedExecute(
      confirmed,
      {},
      { ...ctx(async () => false), ledger },
      'call-10',
    )
    await ledger.finalize('completed')
    expect(result).toEqual({ ok: false, error: 'user_rejected' })
    const events = await eventsForRun('run_reject')
    expect(events.some((e) => e.type === 'ActionStarted')).toBe(false)
    expect(events.find((e) => e.type === 'PermissionDenied')?.payload).toMatchObject({
      toolCallId: 'call-10',
    })
  })
})

describe('remember confirmation floor (memory-poisoning defence)', () => {
  it('model-issued remember always surfaces to the user, so its explicit_user provenance is honest', async () => {
    expect(remember.confirmWhen?.({ summary: 'anything' })).toBe(true)
    const result = await gatedExecute(
      remember,
      { summary: 'planted' },
      ctx(async () => false),
    )
    expect(result).toEqual({ ok: false, error: 'user_rejected' })
  })
})
