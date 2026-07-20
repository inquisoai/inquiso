import { SettingRow } from '@/ui/components/SettingRow'

interface Props {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

/** A labelled on/off row used for the settings switches. */
export function Toggle({ label, checked, onChange }: Props) {
  return (
    <SettingRow as="label">
      <span className="text-ink-dim text-xs leading-relaxed">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 accent-brand"
      />
    </SettingRow>
  )
}
