import type { ProviderInfo } from '@/shared/providers'
import { t } from '@/shared/util/i18n'
import { Select } from '@/ui/components/Select'

interface Props {
  info: ProviderInfo
  value: string
  onChange: (modelId: string) => void
}

const cls = 'min-w-0 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs outline-none'

/** Model chooser: a dropdown for fixed-list providers, or a free-text input
 * for compatible providers/gateways (type any model id the endpoint serves). */
export function ModelField({ info, value, onChange }: Props) {
  if (info.kind === 'compatible') {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('modelIdPlaceholder', 'model id')}
        aria-label={`${info.label} ${t('modelLabel', 'Model')}`}
        className={`${cls} flex-1`}
      />
    )
  }
  if (info.models.length <= 1) return null
  return (
    <Select
      value={value}
      onChange={onChange}
      aria-label={`${info.label} ${t('modelLabel', 'Model')}`}
      wrapClassName="min-w-0"
      className="border border-line bg-surface-2"
    >
      {info.models.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </Select>
  )
}
