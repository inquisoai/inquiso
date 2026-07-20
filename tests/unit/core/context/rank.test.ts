import { describe, expect, it } from 'vitest'
import { buildContext } from '@/core/context/envelope'
import { rankPages } from '@/core/context/rank'
import type { PageContext } from '@/shared/page'

const page = (id: string, text: string): PageContext => ({
  url: `https://example.com/${id}`,
  title: id,
  text,
  lengthChars: text.length,
  contentHash: id,
  extractedAt: 0,
})

describe('rankPages', () => {
  it('orders pages by query-term overlap', () => {
    const pages = [page('a', 'nothing relevant here'), page('b', 'quantum computing breakthrough')]
    const ranked = rankPages(pages, 'quantum computing')
    expect(ranked[0]?.title).toBe('b')
  })

  it('preserves order for an empty query', () => {
    const pages = [page('a', 'x'), page('b', 'y')]
    expect(rankPages(pages, '').map((p) => p.title)).toEqual(['a', 'b'])
  })
})

describe('buildContext', () => {
  it('wraps each page in a delimited envelope', () => {
    const ctx = buildContext([page('a', 'hello')], 10_000)
    expect(ctx).toContain('<page url="https://example.com/a"')
    expect(ctx).toContain('</page>')
  })

  it('respects the character budget', () => {
    const big = page('a', 'x'.repeat(5000))
    expect(buildContext([big], 200).length).toBeLessThanOrEqual(200)
  })

  it('preserves the given page order', () => {
    const ctx = buildContext([page('first', 'a'), page('second', 'b')], 10_000)
    expect(ctx.indexOf('/first')).toBeLessThan(ctx.indexOf('/second'))
  })
})
