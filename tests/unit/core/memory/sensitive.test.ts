import { describe, expect, it } from 'vitest'
import { candidateText, detectSensitive } from '@/core/memory/pipeline/sensitive'

describe('sensitive-data detection', () => {
  it.each([
    ['my password is hunter2', 'password'],
    ['store this API key for later', 'api_key'],
    ['the session token expires hourly', 'token'],
    ['remember my 2FA code 123456', 'otp_code'],
    ['seed phrase: ripple umbrella…', 'private_key'],
  ])('flags keyword phrasing: %s', (text, kind) => {
    expect(detectSensitive(text)?.kind).toBe(kind)
  })

  it.each([
    ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9P', 'token'],
    ['sk-abc123def456ghi789jkl012', 'api_key'],
    ['ghp_abcdefghijklmnopqrstuvwx', 'api_key'],
    ['-----BEGIN RSA PRIVATE KEY-----', 'private_key'],
  ])('flags secret-shaped values', (text, kind) => {
    expect(detectSensitive(text)?.kind).toBe(kind)
  })

  it('flags Luhn-valid card numbers but not arbitrary digit runs', () => {
    expect(detectSensitive('card: 4532 0151 1283 0366')?.kind).toBe('card_number')
    expect(detectSensitive('order number 1234 5678 9012 3452')?.kind).toBe('card_number')
    expect(detectSensitive('invoice 1234567890123 total')).toBeNull()
  })

  it('passes benign task knowledge through', () => {
    expect(detectSensitive('The user prefers PDF exports.')).toBeNull()
    expect(detectSensitive('Billing is under Account, not Settings.')).toBeNull()
  })

  it('scans nested structured content, not just the summary', () => {
    const text = candidateText('benign summary', { nested: { note: 'password: abc' } })
    expect(detectSensitive(text)?.kind).toBe('password')
  })
})
