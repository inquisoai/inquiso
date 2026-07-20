import type { AppConfig } from '@/shared/config'
import { t } from '@/shared/util/i18n'
import type { useConfig } from '@/ui/hooks/use-config'
import { AddProviderForm } from './AddProviderForm'
import { ProviderCard } from './ProviderCard'

type Cfg = ReturnType<typeof useConfig>
type Props = Pick<
  Cfg,
  'setProvider' | 'setModel' | 'saveKey' | 'removeKey' | 'addProvider' | 'removeProvider'
> & { config: AppConfig }

/** Models tab: pick the active provider, manage keys, add custom endpoints. */
export function ProvidersPanel({
  config,
  setProvider,
  setModel,
  saveKey,
  removeKey,
  addProvider,
  removeProvider,
}: Props) {
  return (
    <>
      <p className="text-ink-dim text-xs leading-relaxed">
        {t(
          'settingsIntro',
          'Inquiso runs entirely on your device — no Inquiso server. Pick a provider and, for cloud models, paste your own API key (stored encrypted, never synced or shared).',
        )}
      </p>
      {config.providers.map((info) => (
        <ProviderCard
          key={info.id}
          info={info}
          active={config.providerId === info.id}
          onSelect={() => void setProvider(info.id)}
          hasKey={config.keyStatus[info.id] ?? false}
          model={config.models[info.id] ?? info.defaultModel}
          onSaveKey={(key) => void saveKey(info.id, key)}
          onRemoveKey={() => void removeKey(info.id)}
          onModel={(modelId) => void setModel(info.id, modelId)}
          {...(info.custom ? { onRemove: () => void removeProvider(info.id) } : {})}
        />
      ))}
      <AddProviderForm onAdd={addProvider} />
    </>
  )
}
