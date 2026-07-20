import type { AppConfig } from '@/shared/config'
import { t } from '@/shared/util/i18n'
import { Button } from '@/ui/components/Button'
import { Logo } from '@/ui/components/Logo'
import { providerNotice } from '@/ui/features/chat/provider-notice'

interface Props {
  onSuggest: (question: string) => void
  config: AppConfig | null
  onOpenSettings: () => void
}

const SUGGESTIONS: ReadonlyArray<{ key: string; fallback: string; question: string }> = [
  { key: 'suggestSummarize', fallback: 'Summarize this page', question: 'Summarize this page.' },
  {
    key: 'suggestTrust',
    fallback: 'Can I trust this site?',
    question: 'Is this page trustworthy?',
  },
  {
    key: 'suggestExplain',
    fallback: 'Explain this in simple terms',
    question: 'Explain this page in simple terms.',
  },
]

/** First-run landing: the Inquiso mark + a confident tagline, one-tap
 * suggestions, and the local-first promise as a signature footer. Its own
 * identity — no time-of-day greeting, single violet accent, no gradient. */
export function EmptyState({ onSuggest, config, onOpenSettings }: Props) {
  const notice = config ? providerNotice(config) : null
  return (
    <div className="flex flex-1 flex-col justify-end gap-6 overflow-auto pb-2">
      <div className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 font-semibold text-brand text-sm">
          <Logo className="h-4 w-4" />
          {t('appName', 'Inquiso')}
        </span>
        <h2 className="font-semibold text-2xl text-ink leading-snug">
          {t('emptyTagline', 'Ask anything about the page you’re on.')}
        </h2>
      </div>
      {notice ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-4">
          <p className="text-ink text-sm leading-relaxed">{notice}</p>
          <Button className="px-4" onClick={onOpenSettings}>
            {t('openSettings', 'Open Settings')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onSuggest(s.question)}
              className="group flex cursor-pointer items-center justify-between gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3 text-left text-sm shadow-sm transition-all hover:border-ink/30 hover:bg-surface-2 hover:shadow active:scale-[0.99]"
            >
              <span>{t(s.key, s.fallback)}</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-ink-dim transition-all group-hover:bg-brand group-hover:text-surface">
                →
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="rounded-2xl border border-brand/20 bg-brand/5 p-3.5 text-ink-dim text-xs leading-relaxed">
        <span className="font-medium text-brand">{t('privacyTitle', 'Private by design.')}</span>{' '}
        {t(
          'privacyNote',
          'Inquiso is open source and has no servers. Everything stays local: your questions go straight from your browser to the AI you choose, using your own key. No account, no tracking, no chat reviews — ever.',
        )}
      </p>
    </div>
  )
}
