import { describe, expect, it } from 'vitest'
import { classify } from '@/core/agent/verify/classify'
import type { ActionSnapshot } from '@/core/agent/verify/snapshot'

const page = (url: string, title = 't'): ActionSnapshot => ({ page: { url, title }, element: null })
const field = (value: string): ActionSnapshot => ({
  page: { url: 'https://a.test/', title: 't' },
  element: { exists: true, value },
})

describe('outcome classification', () => {
  it('a failed tool result is verified_failure with tool_error evidence', () => {
    const v = classify({
      tool: 'click',
      ok: false,
      error: 'element_not_found',
      before: page('https://a.test/'),
      after: page('https://a.test/'),
    })
    expect(v.outcome).toBe('verified_failure')
    expect(v.evidence[0]).toEqual({ type: 'tool_error', error: 'element_not_found' })
  })

  it('navigate verifies only on an observed URL change', () => {
    const moved = classify({
      tool: 'navigate',
      ok: true,
      before: page('https://a.test/'),
      after: page('https://a.test/reports'),
    })
    expect(moved.outcome).toBe('verified_success')
    expect(moved.evidence[0]?.type).toBe('url_changed')
    const stuck = classify({
      tool: 'navigate',
      ok: true,
      before: page('https://a.test/'),
      after: page('https://a.test/'),
    })
    expect(stuck.outcome).toBe('uncertain')
  })

  it('a dispatched click with no observable change is uncertain, not success', () => {
    const v = classify({
      tool: 'click',
      ok: true,
      before: page('https://a.test/'),
      after: page('https://a.test/'),
    })
    expect(v.outcome).toBe('uncertain')
  })

  it('click verifies when the page or element observably changed', () => {
    const v = classify({
      tool: 'click',
      ok: true,
      before: page('https://a.test/', 'Cart (0)'),
      after: page('https://a.test/', 'Cart (1)'),
    })
    expect(v.outcome).toBe('verified_success')
    expect(v.evidence[0]?.type).toBe('title_changed')
  })

  it('type verifies against the expected field value — and fails on mismatch', () => {
    const okv = classify({
      tool: 'type',
      ok: true,
      before: field(''),
      after: field('June report'),
      expectedValue: 'June report',
    })
    expect(okv.outcome).toBe('verified_success')
    const swallowed = classify({
      tool: 'type',
      ok: true,
      before: field(''),
      after: field(''),
      expectedValue: 'June report',
    })
    expect(swallowed.outcome).toBe('verified_failure')
  })

  it('type stays uncertain when the field is unobservable (e.g. password)', () => {
    const v = classify({
      tool: 'type',
      ok: true,
      before: { page: null, element: { exists: true } },
      after: { page: null, element: { exists: true } },
      expectedValue: 'secret',
    })
    expect(v.outcome).toBe('uncertain')
  })
})
