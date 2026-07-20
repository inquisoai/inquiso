import { APICallError } from 'ai'
import { describe, expect, it } from 'vitest'
import { friendlyError } from '@/core/agent/errors'

const apiError = (statusCode: number) =>
  new APICallError({
    message: 'boom',
    url: 'https://api.example.com',
    requestBodyValues: {},
    statusCode,
    isRetryable: false,
  })

describe('friendlyError', () => {
  it('maps the missing-key sentinel to a Settings hint', () => {
    expect(friendlyError(new Error('missing_api_key'))).toMatch(/API key/i)
  })

  it('passes generic errors and strings through untouched', () => {
    expect(friendlyError(new Error('something specific'))).toBe('something specific')
    expect(friendlyError('raw string')).toBe('raw string')
  })

  it('explains provider HTTP failures by status code', () => {
    expect(friendlyError(apiError(401))).toMatch(/API key/i)
    expect(friendlyError(apiError(429))).toMatch(/rate-limited/i)
    expect(friendlyError(apiError(503))).toMatch(/server error/i)
  })
})
