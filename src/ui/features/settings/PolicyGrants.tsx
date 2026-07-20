import { t } from '@/shared/util/i18n'
import { usePolicyGrants } from '@/ui/hooks/use-policy-grants'

/**
 * Standing capability rules the user has created (allow/deny per site).
 * Grants are created only here — never by the model, a memory, or a page —
 * and irreversible capabilities always re-confirm regardless (docs/memory-agent §16).
 */
export function PolicyGrants() {
  const { grants, remove } = usePolicyGrants()

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="font-medium text-ink-dim text-xs uppercase tracking-wide">
        {t('policyTitle', 'Agent capability rules')}
      </h3>
      {grants.length === 0 ? (
        <p className="text-ink-dim text-xs">
          {t(
            'policyEmpty',
            'No standing rules. Sensitive actions (submitting, sending, deleting, purchasing) always ask, and nothing the agent remembers can grant itself permissions.',
          )}
        </p>
      ) : (
        grants.map((g) => (
          <div
            key={`${g.origin}|${g.capability}`}
            className="flex items-center justify-between rounded-lg border border-line bg-surface px-2 py-1.5 text-xs"
          >
            <span>
              <span className={g.decision === 'deny' ? 'text-red-600' : 'text-emerald-600'}>
                {g.decision}
              </span>{' '}
              {g.capability.replace('_', ' ')} · {g.origin}
            </span>
            <button
              type="button"
              className="rounded px-1.5 py-0.5 text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink"
              onClick={() => void remove(g)}
            >
              {t('policyRemove', 'Remove')}
            </button>
          </div>
        ))
      )}
    </section>
  )
}
