import type { RunMeta } from '@/shared/memory/events'
import { t } from '@/shared/util/i18n'

const OUTCOME_LABEL: Record<string, string> = {
  completed: '✓',
  aborted: '⏹',
  error: '✕',
  interrupted: '⚠',
}

/** Task history from the event ledger, with the measured per-run metrics that
 * make repeated-task improvement visible (actions, recoveries, model calls). */
export function RunHistory({ runs }: { runs: RunMeta[] }) {
  if (runs.length === 0) {
    return <p className="p-2 text-ink-dim text-sm">{t('memNoRuns', 'No recorded tasks yet.')}</p>
  }
  return (
    <div className="flex flex-col gap-1.5">
      {runs.slice(0, 30).map((r) => (
        <div key={r.runId} className="rounded-lg border border-line bg-surface p-2">
          <p className="text-sm">
            <span className="mr-1">{OUTCOME_LABEL[r.outcome ?? 'interrupted']}</span>
            {r.goal || t('memUntitledRun', 'Untitled task')}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-dim">
            {new Date(r.startedAt).toLocaleString()}
            {' · '}
            {t('memRunActions', 'actions')}: {r.metrics.actions}
            {' · '}
            {t('memRunFailures', 'failures')}: {r.metrics.failures}
            {' · '}
            {t('memRunRecoveries', 'recoveries')}: {r.metrics.recoveries}
            {' · '}
            {t('memRunCalls', 'model calls')}: {r.metrics.modelCalls}
            {r.metrics.tokens > 0 ? ` · ${t('memRunTokens', 'tokens')}: ${r.metrics.tokens}` : ''}
          </p>
          {r.origins.length > 0 && (
            <p className="text-[11px] text-ink-dim">{r.origins.join(' · ')}</p>
          )}
        </div>
      ))}
    </div>
  )
}
