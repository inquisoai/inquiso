import { browser } from '@/platform'
import { decryptString, encryptString } from './crypto'

/**
 * Encrypted API-key storage. Lives ONLY in the background worker — content
 * scripts and page contexts never call this (docs/05-security.md T2). Keys are
 * never logged, synced, or returned to the UI (the UI only learns has/has-not).
 */
const PREFIX = 'apikey:'
const keyName = (provider: string): string => `${PREFIX}${provider}`

export async function setKey(provider: string, apiKey: string): Promise<void> {
  await browser.storage.local.set({ [keyName(provider)]: await encryptString(apiKey) })
}

export async function getKey(provider: string): Promise<string | null> {
  const name = keyName(provider)
  const record = await browser.storage.local.get(name)
  const blob = record[name]
  if (typeof blob !== 'string') return null
  try {
    return await decryptString(blob)
  } catch {
    return null
  }
}

export async function removeKey(provider: string): Promise<void> {
  await browser.storage.local.remove(keyName(provider))
}

export async function hasKey(provider: string): Promise<boolean> {
  const name = keyName(provider)
  const record = await browser.storage.local.get(name)
  return typeof record[name] === 'string'
}
