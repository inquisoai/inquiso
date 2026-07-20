import type { AttachmentRef } from '@/shared/attachment'
import { FileIcon } from '@/ui/components/icons'
import { useAttachmentUrls } from '@/ui/hooks/use-attachment-urls'

interface Props {
  attachments: AttachmentRef[]
}

/**
 * Read-only preview of the files sent with a user message, shown in the chat
 * (right-aligned with the user bubble). Resolves each ref to a URL — a data URL
 * for the live turn, an object URL from the on-device blob store on reload.
 * Images render as openable thumbnails; other files show as a labelled chip.
 */
export function AttachmentPreview({ attachments }: Props) {
  const items = useAttachmentUrls(attachments)
  return (
    <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5 self-end">
      {items.map((f) =>
        f.mediaType.startsWith('image/') ? (
          <a key={f.url} href={f.url} target="_blank" rel="noreferrer">
            <img
              src={f.url}
              alt={f.name}
              className="max-h-44 rounded-2xl rounded-br-lg border border-line object-cover"
            />
          </a>
        ) : (
          <span
            key={f.url}
            className="flex items-center gap-1.5 rounded-2xl rounded-br-lg bg-surface-2 px-3 py-2 text-xs"
          >
            <FileIcon className="shrink-0 text-ink-dim" />
            <span className="max-w-40 truncate">{f.name}</span>
          </span>
        ),
      )}
    </div>
  )
}
