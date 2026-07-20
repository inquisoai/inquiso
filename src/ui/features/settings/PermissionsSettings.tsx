import { API_PERMISSIONS } from '@/core/auth/api-permissions'
import { t } from '@/shared/util/i18n'
import { usePermissions } from '@/ui/hooks/use-permissions'
import { PolicyGrants } from './PolicyGrants'
import { Toggle } from './Toggle'

const LABELS: Record<string, string> = {
  bookmarks: 'Bookmarks — read & add',
  history: 'Browsing history — search',
  tabGroups: 'Tab groups — create & edit (Chromium)',
  sessions: 'Reopen recently closed tabs',
}

/** Optional-permission grants for the agent. All off until the user opts in —
 * least privilege by consent (docs/adr/0003). Toggling requests/revokes the
 * browser permission directly (needs this UI gesture). */
export function PermissionsSettings() {
  const { granted, toggleApi, toggleAllSites } = usePermissions()
  if (!granted) return null

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-medium text-sm">{t('permissionsTitle', 'Agent permissions')}</h3>
      {API_PERMISSIONS.map((p) => (
        <Toggle
          key={p}
          label={t(`perm${p[0]?.toUpperCase()}${p.slice(1)}`, LABELS[p] ?? p)}
          checked={granted[p]}
          onChange={(v) => void toggleApi(p, v)}
        />
      ))}
      <Toggle
        label={t(
          'permAllSites',
          'Access all sites (skip the per-site prompt for multi-site tasks — grants broad access; revoke anytime)',
        )}
        checked={granted.allSites}
        onChange={(v) => void toggleAllSites(v)}
      />
      <PolicyGrants />
    </section>
  )
}
