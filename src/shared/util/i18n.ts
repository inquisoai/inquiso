import { browser } from 'wxt/browser'

/**
 * Translates a message key via the browser i18n API, falling back to the
 * provided English default (so the UI still renders in tests / if a key is
 * missing). Strings live in public/_locales/<lang>/messages.json.
 */
export function t(key: string, fallback: string): string {
  const i18n = browser.i18n
  if (!i18n?.getMessage) return fallback
  // WXT augments getMessage with generated key types; call it as a plain lookup.
  const getMessage = i18n.getMessage as (key: string) => string
  return getMessage(key) || fallback
}
