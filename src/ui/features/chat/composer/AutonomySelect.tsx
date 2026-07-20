import { AUTONOMY_LEVELS, type Autonomy } from '@/shared/autonomy'
import { t } from '@/shared/util/i18n'
import { Select } from '@/ui/components/Select'
import { autonomyLabel, autonomyShort } from '@/ui/config/autonomy-labels'

interface Props {
  value: Autonomy
  onChange: (a: Autonomy) => void
}

/** Per-run autonomy picker in the composer. Compact (one word) so it doesn't
 * crowd the row; defaults to the saved setting and applies to the next send. */
export function AutonomySelect({ value, onChange }: Props) {
  return (
    <Select
      value={value}
      onChange={(v) => onChange(v as Autonomy)}
      aria-label={t('autonomyRun', 'Autonomy for this run')}
      title={autonomyLabel(value)}
      wrapClassName="shrink-0"
      className="whitespace-nowrap text-ink-dim transition-colors hover:bg-surface-3 hover:text-ink"
    >
      {AUTONOMY_LEVELS.map((a) => (
        <option key={a} value={a}>
          {autonomyShort(a)}
        </option>
      ))}
    </Select>
  )
}
