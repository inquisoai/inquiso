import { useEffect, useState } from 'react'
import { t } from '@/shared/util/i18n'
import { ChevronDownIcon, SparkleIcon } from '@/ui/components/icons'
import { Markdown } from '@/ui/components/Markdown'
import type { TraceItem } from '@/ui/features/session/types'
import { ToolLine } from './ToolLine'

interface Props {
  trace: TraceItem[]
  busy: boolean
  durationMs?: number
  /** Tokens the run cost, shown next to the duration once settled. */
  tokens?: number
}

/** Collapsed reasoning block (ChatGPT/Grok pattern): a shimmering "Thinking…"
 * with a live timer while the model reasons, a "Thought for Ns" summary once
 * done, and the chain of thought on a rail when expanded. Collapsed by default. */
export function Thoughts({ trace, busy, durationMs, tokens }: Props) {
  const [open, setOpen] = useState(false)
  const [sec, setSec] = useState(0)

  useEffect(() => {
    if (!busy) return setSec(0)
    const id = setInterval(() => setSec((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [busy])

  if (trace.length === 0) return null

  const seconds = Math.max(1, Math.round((durationMs ?? 0) / 1000))
  const suffix = !busy && tokens ? ` · ${tokens} ${t('tokensWord', 'tokens')}` : ''
  const label =
    (busy
      ? `${t('thinking', 'Thinking')}${sec ? ` ${sec}s` : '…'}`
      : durationMs
        ? `${t('thoughtFor', 'Thought for')} ${seconds}s`
        : t('thoughts', 'Thoughts')) + suffix

  return (
    <div className="rounded-2xl border border-line/70 bg-surface-2/50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs"
      >
        <SparkleIcon className="h-3.5 w-3.5 shrink-0 text-brand" />
        <span className={busy ? 'shimmer font-medium' : 'font-medium text-ink-dim'}>{label}</span>
        <ChevronDownIcon
          className={`ml-auto h-4 w-4 shrink-0 text-ink-dim transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-2 border-line/70 border-t px-3 py-2.5">
          {trace.map((item, i) =>
            item.kind === 'reasoning' ? (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: trace is append-only.
                key={i}
                className="border-line border-l-2 pl-3"
              >
                <Markdown text={item.text} className="text-ink-dim text-[13px]" />
              </div>
            ) : (
              <ToolLine key={item.callId || `t${i}`} item={item} />
            ),
          )}
        </div>
      )}
    </div>
  )
}
