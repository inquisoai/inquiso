import type { Attachment } from '@/shared/attachment'
import { t } from '@/shared/util/i18n'
import { XIcon } from '@/ui/components/icons'

interface Props {
  files: Attachment[]
  onRemove: (name: string) => void
}

/** Pending attachments shown as removable chips above the composer input. */
export function AttachmentChips({ files, onRemove }: Props) {
  if (files.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {files.map((f) => (
        <span
          key={f.name}
          className="flex items-center gap-1.5 rounded-lg bg-surface-3 py-1 pr-1 pl-2.5 text-xs"
        >
          {f.mediaType.startsWith('image/') && (
            <img src={f.dataUrl} alt="" className="h-5 w-5 rounded object-cover" />
          )}
          <span className="max-w-32 truncate">{f.name}</span>
          <button
            type="button"
            onClick={() => onRemove(f.name)}
            aria-label={`${t('remove', 'Remove')} ${f.name}`}
            className="rounded px-1 text-ink-dim hover:text-ink"
          >
            <XIcon />
          </button>
        </span>
      ))}
    </div>
  )
}
