import { fromBase64, toBase64 } from '@/shared/util/base64'

/**
 * AES-GCM encryption for API keys. The master key is generated NON-EXTRACTABLE
 * and stored as a CryptoKey object in IndexedDB — code can decrypt but cannot
 * read the raw key bytes. This raises the bar but is not absolute: a fully
 * compromised browser profile can still reach storage (docs/05-security.md T2).
 */
const DB_NAME = 'inquiso-secure'
const STORE = 'crypto'
const MASTER = 'master-key'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = run(db.transaction(STORE, mode).objectStore(STORE))
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error)
      }),
  )
}

async function masterKey(): Promise<CryptoKey> {
  const existing = await tx<CryptoKey | undefined>('readonly', (s) => s.get(MASTER))
  if (existing) return existing
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ])
  await tx('readwrite', (s) => s.put(key, MASTER))
  return key
}

export async function encryptString(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const buf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await masterKey(),
    new TextEncoder().encode(plain),
  )
  return `${toBase64(iv)}:${toBase64(new Uint8Array(buf))}`
}

export async function decryptString(blob: string): Promise<string> {
  const [ivPart, ctPart] = blob.split(':')
  if (!ivPart || !ctPart) throw new Error('bad_ciphertext')
  const buf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(ivPart) },
    await masterKey(),
    fromBase64(ctPart),
  )
  return new TextDecoder().decode(buf)
}
