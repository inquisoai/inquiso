import localforage from 'localforage'
import { appStore } from '@/core/data/storage/instance'
import { fromBase64 } from '@/shared/util/base64'

/**
 * On-device blob store for chat attachments (docs/adr/0005). Bytes are stored
 * as native `Blob`s (no base64 bloat), keyed by attachment id, in their own
 * IndexedDB store so reading conversations stays cheap. Local only, never
 * synced. Shared origin, so the side panel reads the same store the background
 * writes. Pin IndexedDB so we never fall back to a string-serializing backend.
 */
const store = appStore('attachments', { driver: localforage.INDEXEDDB })

interface Stored {
  id: string
  name: string
  mediaType: string
  blob: Blob
}

/** Decodes a `data:` URL into a Blob (raw bytes, no encoding overhead). */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',')
  const meta = dataUrl.slice(5, comma)
  const mediaType = meta.split(';')[0] || 'application/octet-stream'
  return new Blob([fromBase64(dataUrl.slice(comma + 1))], { type: mediaType })
}

export async function putAttachment(a: {
  id: string
  name: string
  mediaType: string
  blob: Blob
}) {
  await store.setItem(a.id, a satisfies Stored)
}

export async function getAttachmentBlob(id: string): Promise<Blob | null> {
  const v = (await store.getItem(id)) as Stored | null
  return v?.blob ?? null
}

/** Sweeps out any blob whose id isn't in `keep` — the GC for orphans. */
export async function keepOnly(keep: Set<string>): Promise<void> {
  const drop: string[] = []
  await store.iterate((_v, key) => {
    if (!keep.has(key)) drop.push(key)
  })
  await Promise.all(drop.map((k) => store.removeItem(k)))
}

/** Removes every stored attachment (user "clear attachments"). */
export const clearAttachments = (): Promise<void> => store.clear()
