import { describe, expect, it } from 'vitest'
import { importHistory } from '@/core/data/history/transfer'
import { HistoryExport } from '@/shared/history'

const valid = {
  v: 1,
  exportedAt: 1_700_000_000_000,
  conversations: [
    {
      id: 'a',
      title: 'Hi',
      createdAt: 1,
      updatedAt: 2,
      turns: [{ role: 'user', content: 'hi' }],
    },
  ],
}

describe('history export schema', () => {
  it('accepts a well-formed export', () => {
    expect(HistoryExport.safeParse(valid).success).toBe(true)
  })

  it('rejects wrong version, missing fields, and junk', () => {
    expect(HistoryExport.safeParse({ ...valid, v: 2 }).success).toBe(false)
    expect(HistoryExport.safeParse({ conversations: [] }).success).toBe(false)
    expect(HistoryExport.safeParse('nope').success).toBe(false)
  })
})

describe('importHistory', () => {
  it('rejects an invalid payload before touching storage', async () => {
    await expect(importHistory({ garbage: true })).rejects.toThrow('invalid_export_file')
  })
})
