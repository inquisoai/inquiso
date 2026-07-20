import { t } from '@/shared/util/i18n'
import type { ConfirmReq } from '@/ui/features/session/types'

interface Props {
  req: ConfirmReq
  onResolve: (id: string, approved: boolean) => void
}

/** Inline approval gate for a sensitive action (docs/05-security.md risk
 * gate), styled as an action card with clear approve/reject affordances. */
export function ConfirmPrompt({ req, onResolve }: Props) {
  return (
    <div className="menu-pop rounded-2xl border border-warn/40 bg-warn/10 p-3 text-sm">
      <p>
        {t('allowAction', 'Allow')} <b>{req.tool}</b>?
      </p>
      <code className="mt-1 block break-all text-ink-dim text-xs">{JSON.stringify(req.args)}</code>
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={() => onResolve(req.id, true)}
          className="flex-1 rounded-full bg-brand px-3 py-2 font-medium text-surface text-xs transition-transform active:scale-95"
        >
          {t('approve', 'Approve')}
        </button>
        <button
          type="button"
          onClick={() => onResolve(req.id, false)}
          className="flex-1 rounded-full border border-line bg-surface px-3 py-2 font-medium text-xs transition-transform active:scale-95"
        >
          {t('reject', 'Reject')}
        </button>
      </div>
    </div>
  )
}
