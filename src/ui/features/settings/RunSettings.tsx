import { AUTONOMY_LEVELS, type Autonomy } from '@/shared/autonomy'
import type { AppConfig } from '@/shared/config'
import { t } from '@/shared/util/i18n'
import { Button } from '@/ui/components/Button'
import { Select } from '@/ui/components/Select'
import { SettingRow } from '@/ui/components/SettingRow'
import { autonomyLabel } from '@/ui/config/autonomy-labels'
import { Toggle } from './Toggle'

interface Props {
  config: AppConfig
  setAutonomy: (a: Autonomy) => void
  setReasoning: (v: boolean) => void
  setWebSearch: (v: boolean) => void
  clearCache: () => void
  clearAttachments: () => void
}

const HINT = 'text-ink-dim text-xs leading-relaxed'

/** Run-behaviour settings: autonomy default, reasoning, web search, cache. */
export function RunSettings({
  config,
  setAutonomy,
  setReasoning,
  setWebSearch,
  clearCache,
  clearAttachments,
}: Props) {
  return (
    <>
      <SettingRow>
        <span className={HINT}>
          {t('autonomyLabel', 'Default autonomy (high-risk actions always confirm)')}
        </span>
        <Select
          value={config.autonomy}
          onChange={(v) => setAutonomy(v as Autonomy)}
          wrapClassName="shrink-0"
          className="border border-line bg-surface"
        >
          {AUTONOMY_LEVELS.map((a) => (
            <option key={a} value={a}>
              {autonomyLabel(a)}
            </option>
          ))}
        </Select>
      </SettingRow>
      <Toggle
        label={t(
          'reasoningLabel',
          'Show model reasoning (for models that support it; uses more tokens)',
        )}
        checked={config.reasoning}
        onChange={setReasoning}
      />
      <Toggle
        label={t(
          'webSearchLabel',
          'Allow web search (sends your query to the provider’s search; supported models only)',
        )}
        checked={config.webSearch}
        onChange={setWebSearch}
      />
      <SettingRow as="section">
        <span className={HINT}>
          {t('cacheLabel', 'Cached page content (in memory, local only)')}
        </span>
        <Button variant="secondary" onClick={clearCache}>
          {t('clearCache', 'Clear cache')}
        </Button>
      </SettingRow>
      <SettingRow as="section">
        <span className={HINT}>
          {t('attachmentsLabel', 'Stored attachments (kept on-device so past chats show them)')}
        </span>
        <Button variant="secondary" onClick={clearAttachments}>
          {t('clearAttachments', 'Clear')}
        </Button>
      </SettingRow>
    </>
  )
}
