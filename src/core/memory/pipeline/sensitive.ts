/**
 * Deterministic sensitive-data detection for the memory write gate. Runs
 * BEFORE any model judgement; a hit means the candidate is discarded and only
 * a redacted note reaches the blocked-attempts log. Patterns are intentionally
 * eager — a false discard is cheap, a stored secret is not (docs/05).
 */

export interface SensitiveHit {
  kind: 'password' | 'api_key' | 'token' | 'card_number' | 'otp_code' | 'private_key' | 'cookie'
  reason: string
}

const KEYWORDS: Array<[RegExp, SensitiveHit['kind']]> = [
  [/\bpassword\b|\bpasscode\b|\bpasswort\b/i, 'password'],
  [/\bapi[_ -]?key\b|\bsecret[_ -]?key\b/i, 'api_key'],
  [/\b(session|auth|bearer|refresh|access)[_ -]?token\b/i, 'token'],
  [/\bset-cookie\b|\bsession[_ -]?cookie\b/i, 'cookie'],
  [/\b(one[_ -]?time[_ -]?code|otp|2fa code|verification code)\b/i, 'otp_code'],
  [/\brecovery (code|phrase|key)\b|\bseed phrase\b/i, 'private_key'],
]

const VALUES: Array<[RegExp, SensitiveHit['kind'], string]> = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private_key', 'PEM private key material'],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\b/, 'token', 'JWT-shaped token'],
  [/\bsk-[A-Za-z0-9_-]{16,}\b/, 'api_key', 'provider API key shape'],
  [/\b(?:ghp|gho|github_pat)_[A-Za-z0-9_]{16,}\b/, 'api_key', 'GitHub token shape'],
  [/\b[A-Fa-f0-9]{40,}\b/, 'token', 'long hex secret shape'],
]

/** Luhn check over 13–19 digit runs (allowing space/dash separators). */
function hasCardNumber(text: string): boolean {
  for (const match of text.matchAll(/\b(?:\d[ -]?){13,19}\b/g)) {
    const digits = match[0].replace(/\D/g, '')
    if (digits.length < 13 || digits.length > 19) continue
    let sum = 0
    let dbl = false
    for (let i = digits.length - 1; i >= 0; i -= 1) {
      let d = Number(digits[i])
      if (dbl) {
        d *= 2
        if (d > 9) d -= 9
      }
      sum += d
      dbl = !dbl
    }
    if (sum % 10 === 0) return true
  }
  return false
}

/** Scans candidate text (summary + structured values) for secrets. */
export function detectSensitive(text: string): SensitiveHit | null {
  for (const [re, kind, reason] of VALUES) {
    if (re.test(text)) return { kind, reason }
  }
  if (hasCardNumber(text)) return { kind: 'card_number', reason: 'card-number shape (Luhn valid)' }
  for (const [re, kind] of KEYWORDS) {
    if (re.test(text)) return { kind, reason: `mentions ${kind.replace('_', ' ')}` }
  }
  return null
}

/** Every string reachable in a candidate's content, flattened for scanning. */
export function candidateText(summary: string, content: Record<string, unknown>): string {
  const parts: string[] = [summary]
  const walk = (v: unknown): void => {
    if (typeof v === 'string') parts.push(v)
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(content)
  return parts.join('\n')
}
