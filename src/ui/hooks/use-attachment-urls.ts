import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getAttachmentBlob } from '@/core/data/attachments/store'
import type { Attachment, AttachmentRef } from '@/shared/attachment'

export interface ResolvedAttachment {
  name: string
  mediaType: string
  url: string
}

const NO_ITEMS: ResolvedAttachment[] = []

async function resolve(refs: AttachmentRef[]): Promise<ResolvedAttachment[]> {
  const items = await Promise.all(
    refs.map(async (r) => {
      const dataUrl = (r as Attachment).dataUrl
      if (dataUrl) return { name: r.name, mediaType: r.mediaType, url: dataUrl }
      const blob = await getAttachmentBlob(r.id)
      if (!blob) return null
      return { name: r.name, mediaType: r.mediaType, url: URL.createObjectURL(blob) }
    }),
  )
  return items.filter((x): x is ResolvedAttachment => x !== null)
}

/**
 * Resolves a turn's attachment refs to renderable URLs. A live turn already
 * carries a data URL; a reloaded turn fetches the Blob from the on-device store
 * and gets an object URL (revoked when the data is replaced or unmounts, to
 * avoid leaks — gcTime 0 keeps revoked URLs out of the cache, and attachments
 * are immutable so the data never goes stale). Reading the blob store directly
 * is the one UI↔storage exception — Blobs can't cross runtime.sendMessage, so
 * the side panel loads them from the shared IndexedDB.
 */
export function useAttachmentUrls(refs: AttachmentRef[] | undefined): ResolvedAttachment[] {
  const { data } = useQuery({
    queryKey: ['attachment-urls', ...(refs?.map((r) => r.id) ?? [])],
    queryFn: () => resolve(refs ?? []),
    enabled: !!refs?.length,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  })

  useEffect(() => {
    if (!data) return
    return () => {
      for (const { url } of data) if (url.startsWith('blob:')) URL.revokeObjectURL(url)
    }
  }, [data])

  return data ?? NO_ITEMS
}
