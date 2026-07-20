import { useState } from 'react'
import { t } from '@/shared/util/i18n'
import { host } from '@/shared/util/url'
import { ChevronDownIcon, GlobeIcon } from '@/ui/components/icons'
import type { Source } from '@/ui/features/session/types'

interface Props {
  sources: Source[]
}

/** Collapsible "Sources" pill under an answer that used provider web search —
 * lists the cited pages, each opening in a new tab. */
export function MessageSources({ sources }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col gap-1.5 self-start">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-fit items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-xs transition-colors hover:bg-surface-3"
      >
        <GlobeIcon className="text-brand" />
        {t('sources', 'Sources')}
        <span className="text-ink-dim">{sources.length}</span>
        <ChevronDownIcon className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ol className="flex flex-col gap-1 pl-1">
          {sources.map((s, i) => (
            <li key={s.url} className="truncate text-xs">
              <span className="text-ink-dim">{i + 1}.</span>{' '}
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:underline"
              >
                {s.title || host(s.url)}
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
