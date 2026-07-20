import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  finishCheckpoint,
  interruptedCheckpoint,
  resumeNote,
  startCheckpoint,
  stepCheckpoint,
} from '@/core/memory/checkpoint/service'
import { getCheckpoint } from '@/core/memory/checkpoint/store'

vi.mock('localforage', async () => (await import('../../helpers/memdb')).localforageMock())

describe('checkpoint engine', () => {
  beforeEach(() => finishCheckpoint('t1'))

  it('advances the resume point with verified steps', async () => {
    await startCheckpoint('t1', 'run_a', 'export the report')
    await stepCheckpoint('t1', {
      lastSeq: 4,
      lastAction: 'click',
      page: { url: 'https://site.test/reports' },
      completedStep: 'click verified on https://site.test/reports',
    })
    const cp = await getCheckpoint('t1')
    expect(cp?.lastSeq).toBe(4)
    expect(cp?.completedSteps).toHaveLength(1)
    expect(cp?.page?.url).toBe('https://site.test/reports')
  })

  it('detects an interruption only for a different, still-active run', async () => {
    await startCheckpoint('t1', 'run_a', 'goal')
    // Same run asking again: not an interruption.
    expect(await interruptedCheckpoint('t1', 'run_a')).toBeNull()
    // A new run finds the stale active checkpoint: interrupted.
    const found = await interruptedCheckpoint('t1', 'run_b')
    expect(found?.runId).toBe('run_a')
  })

  it('completion removes the resume point entirely', async () => {
    await startCheckpoint('t1', 'run_a', 'goal')
    await finishCheckpoint('t1')
    expect(await getCheckpoint('t1')).toBeNull()
    expect(await interruptedCheckpoint('t1', 'run_b')).toBeNull()
  })

  it('resume note demands revalidation and forbids repeating side effects', async () => {
    await startCheckpoint('t1', 'run_a', 'file the expense report')
    await stepCheckpoint('t1', { lastSeq: 2, completedStep: 'uploaded invoice.pdf' })
    const cp = await getCheckpoint('t1')
    const note = resumeNote(cp as NonNullable<typeof cp>)
    expect(note).toContain('file the expense report')
    expect(note).toContain('uploaded invoice.pdf')
    expect(note).toMatch(/re-observe/i)
    expect(note).toMatch(/never repeat/i)
  })

  it('ignores step updates once no checkpoint is active', async () => {
    await stepCheckpoint('t1', { lastSeq: 9 })
    expect(await getCheckpoint('t1')).toBeNull()
  })
})
