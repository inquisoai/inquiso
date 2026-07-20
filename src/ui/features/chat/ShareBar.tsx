import type { TabInfo } from '@/shared/page'
import { t } from '@/shared/util/i18n'
import { host } from '@/shared/util/url'
import { GlobeIcon } from '@/ui/components/icons'

interface Props {
  tabs: TabInfo[]
}

/** At-a-glance indicator of what the model will see, sitting just above the
 * composer (the Gemini "Sharing 1 tab" pattern). The "+" menu is the control;
 * this is the always-visible readout. */
export function ShareBar({ tabs }: Props) {
  const summary =
    tabs.length === 0
      ? t('shareNothing', 'No readable page')
      : tabs.length === 1
        ? (tabs[0]?.title ?? '') || host(tabs[0]?.url ?? '')
        : `${tabs.length} ${t('pagesWord', 'pages')}`

  return (
    <div className="flex items-center gap-1.5 self-start rounded-full bg-surface-2 px-2.5 py-1 text-ink-dim text-xs">
      <GlobeIcon className="h-3.5 w-3.5" />
      <span>{t('sharingWith', 'Sharing')}:</span>
      <span className="max-w-52 truncate text-ink">{summary}</span>
    </div>
  )
}
