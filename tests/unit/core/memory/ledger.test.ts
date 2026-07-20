import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRunLedger } from '@/core/memory/ledger/run-ledger'
import { dropRun, eventsForRun, getRun, listRuns } from '@/core/memory/ledger/store'

vi.mock('localforage', async () => (await import('../../helpers/memdb')).localforageMock())

async function finishedRun(taskId: string, n: number) {
  const ledger = createRunLedger(taskId, `run_${n}`, `goal ${n}`)
  ledger.log('TaskCreated', {}, { actor: 'user' })
  await ledger.finalize('completed')
  return ledger
}

describe('run ledger', () => {
  beforeEach(async () => {
    for (const run of await listRuns()) await dropRun(run.runId)
  })

  it('persists events in emission order with contiguous seq', async () => {
    const ledger = createRunLedger('task_1', 'run_a', 'download the invoice')
    ledger.log('TaskCreated', {}, { actor: 'user' })
    ledger.log('ActionStarted', { tool: 'click' })
    ledger.log('ActionSucceeded', { tool: 'click' })
    await ledger.finalize('completed')

    const events = await eventsForRun('run_a')
    expect(events.map((e) => e.type)).toEqual([
      'TaskCreated',
      'ActionStarted',
      'ActionSucceeded',
      'TaskCompleted',
    ])
    expect(events.map((e) => e.seq)).toEqual([1, 2, 3, 4])
    expect(events.every((e) => e.taskId === 'task_1' && e.runId === 'run_a')).toBe(true)
  })

  it('meters actions, failures, and failure→success recoveries', async () => {
    const ledger = createRunLedger('task_1', 'run_b', 'goal')
    ledger.log('ActionStarted', { tool: 'click' })
    ledger.log('ActionFailed', { tool: 'click', error: 'element_not_found' })
    ledger.log('ActionStarted', { tool: 'click' })
    ledger.log('ActionSucceeded', { tool: 'click' })
    await ledger.finalize('completed')

    const run = await getRun('run_b')
    expect(run?.metrics).toMatchObject({ actions: 2, failures: 1, recoveries: 1 })
    expect(run?.outcome).toBe('completed')
  })

  it('collects distinct page origins onto the run meta', async () => {
    const ledger = createRunLedger('task_1', 'run_c', 'goal')
    ledger.log('PageObserved', {}, { page: { url: 'https://a.test/x', origin: 'https://a.test' } })
    ledger.log('PageObserved', {}, { page: { url: 'https://a.test/y', origin: 'https://a.test' } })
    ledger.log('PageObserved', {}, { page: { url: 'https://b.test/', origin: 'https://b.test' } })
    await ledger.finalize('completed')
    expect((await getRun('run_c'))?.origins).toEqual(['https://a.test', 'https://b.test'])
  })

  it('caps retained runs and drops an expired run with its events', async () => {
    // Distinct startedAt per run so "newest first" ordering is deterministic.
    vi.useFakeTimers()
    for (let n = 0; n < 102; n += 1) {
      vi.setSystemTime(1_700_000_000_000 + n * 1000)
      await finishedRun('task_gc', n)
    }
    vi.useRealTimers()
    const runs = await listRuns()
    expect(runs.length).toBe(100)
    // The two oldest runs (0 and 1) were trimmed, events included.
    expect(await getRun('run_0')).toBeNull()
    expect(await eventsForRun('run_0')).toEqual([])
    expect(await eventsForRun('run_101')).not.toEqual([])
  })
})
