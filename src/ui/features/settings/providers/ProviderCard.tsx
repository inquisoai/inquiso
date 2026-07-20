import type { ProviderInfo } from '@/shared/providers'
import { t } from '@/shared/util/i18n'
import { CheckIcon, TrashIcon } from '@/ui/components/icons'
import { KeyInput } from './KeyInput'
import { ModelField } from './ModelField'

interface Props {
  info: ProviderInfo
  active: boolean
  hasKey: boolean
  model: string
  onSelect: () => void
  onSaveKey: (apiKey: string) => void
  onRemoveKey: () => void
  onModel: (modelId: string) => void
  onRemove?: () => void
}

/** One provider as a selectable radio-card: tap the header to make it active;
 * key + model management inline. Custom providers can be removed. */
export function ProviderCard(p: Props) {
  return (
    <section
      className={`flex flex-col gap-2 rounded-2xl border p-3.5 transition-colors ${
        p.active ? 'border-brand/60 bg-brand/5' : 'border-line'
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={p.onSelect}
          className="flex flex-1 items-center justify-between gap-2 text-left"
        >
          <h3 className="font-medium text-sm">{p.info.label}</h3>
          <span
            aria-hidden
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
              p.active ? 'border-brand bg-brand text-surface' : 'border-line'
            }`}
          >
            {p.active && <CheckIcon className="h-3 w-3" />}
          </span>
        </button>
        {p.onRemove && (
          <button
            type="button"
            onClick={p.onRemove}
            aria-label={t('remove', 'Remove')}
            className="rounded-lg p-1 text-ink-dim hover:text-red-500"
          >
            <TrashIcon />
          </button>
        )}
      </div>
      <p className="text-ink-dim text-xs leading-relaxed">{p.info.dataUse}</p>
      {p.info.requiresKey && (
        <KeyInput
          label={p.info.label}
          hasKey={p.hasKey}
          onSave={p.onSaveKey}
          onRemove={p.onRemoveKey}
        />
      )}
      <div className="flex items-center justify-between gap-2">
        <ModelField info={p.info} value={p.model} onChange={p.onModel} />
        {p.info.keyUrl && (
          <a
            href={p.info.keyUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-brand text-xs hover:underline"
          >
            {t('getKey', 'Get a key →')}
          </a>
        )}
      </div>
    </section>
  )
}
