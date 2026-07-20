import type { PageAccess } from '@/core/context/access'
import { t } from '@/shared/util/i18n'
import { host } from '@/shared/util/url'

interface Props {
  access: PageAccess | null
  onGrant: () => void
}

/**
 * One-click way out of "I don't have permission to read this page": shown
 * whenever the current site isn't readable, granting it per-site on tap
 * (least privilege — never <all_urls>; docs/05 T4). Non-web pages (chrome://,
 * the store) have no origin to grant, so nothing is shown there.
 */
export function PageAccessNotice({ access, onGrant }: Props) {
  if (!access || access.readable || !access.origin) return null
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs">
      <span className="min-w-0 flex-1 text-ink-dim">
        {t('pageNoAccess', 'Inquiso can’t read')}{' '}
        <span className="font-medium text-ink">{host(access.origin)}</span>
      </span>
      <button
        type="button"
        onClick={onGrant}
        className="shrink-0 rounded-lg bg-ink px-2.5 py-1.5 font-medium text-surface transition-opacity hover:opacity-85"
      >
        {t('pageGrantAccess', 'Grant access')}
      </button>
    </div>
  )
}
