import { t } from '@/shared/util/i18n'
import type { ToolItem } from '@/ui/features/session/types'

const ICON: Record<string, string> = {
  readPage: '📖',
  queryElements: '🔍',
  scrollTo: '↕',
  click: '👆',
  type: '⌨',
}

/** Grok-style humanized description of a tool call, falling back to raw args. */
function describe(item: ToolItem): string {
  const a = (item.args ?? {}) as Record<string, unknown>
  const q = (v: unknown): string => (typeof v === 'string' && v ? ` "${v}"` : '')
  switch (item.name) {
    case 'readPage':
      return t('toolReadPage', 'Read the page')
    case 'queryElements':
      return `${t('toolQuery', 'Looked for')}${q(a.text ?? a.selector ?? a.role)}`
    case 'scrollTo':
      return t('toolScroll', 'Scrolled an element into view')
    case 'click':
      return t('toolClick', 'Clicked an element')
    case 'type':
      return `${t('toolType', 'Typed')}${q(a.text)}`
    default:
      return `${item.name} ${JSON.stringify(item.args)}`
  }
}

interface Props {
  item: ToolItem
}

/** One tool call as a card in the Thoughts timeline. */
export function ToolLine({ item }: Props) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-surface-2 px-3.5 py-2.5 font-mono text-ink-dim text-xs">
      <span aria-hidden>{ICON[item.name] ?? '⚙'}</span>
      <div className="min-w-0">
        {describe(item)}
        {item.status === 'running' && <span className="animate-pulse"> …</span>}
        {item.status === 'failed' && <span className="ml-1 text-danger">✗ {item.error ?? ''}</span>}
      </div>
    </div>
  )
}
