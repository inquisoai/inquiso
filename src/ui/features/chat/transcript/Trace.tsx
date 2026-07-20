import { t } from '@/shared/util/i18n'
import { Markdown } from '@/ui/components/Markdown'
import type { BudgetState, SessionState } from '@/ui/features/session/types'
import { Thoughts } from './Thoughts'

type Props = Pick<SessionState, 'trace' | 'answer' | 'status' | 'error'> & {
  busy: boolean
  budget?: BudgetState | null
}

/** The live run: collapsible Thoughts (reasoning + tool cards), a budget meter
 * while working, then the streaming answer (transparency — docs/04). */
export function Trace({ trace, answer, status, error, busy, budget }: Props) {
  return (
    <div className="flex flex-col gap-2.5 text-[15px] leading-relaxed">
      {error && (
        <p className="rounded-2xl border border-danger/20 bg-danger/10 p-3 text-danger text-sm">
          {error}
        </p>
      )}
      <Thoughts trace={trace} busy={busy} />
      {status && <p className="animate-pulse text-ink-dim text-sm">{status}</p>}
      {busy && budget && (
        <p className="text-ink-dim text-xs">
          {budget.steps} {t('stepsWord', 'steps')} · {Math.round(budget.ms / 1000)}s
          {budget.tokens > 0 ? ` · ${budget.tokens} ${t('tokensWord', 'tokens')}` : ''}
        </p>
      )}
      {answer && <Markdown text={answer} />}
    </div>
  )
}
