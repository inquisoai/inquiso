import type { AppConfig } from '@/shared/config'
import { t } from '@/shared/util/i18n'

const hasWebGpu = (): boolean => typeof navigator !== 'undefined' && 'gpu' in navigator

/**
 * A one-line "can't chat yet" notice for the active provider, or null when it's
 * ready. Cheap and proactive — derived from config plus a WebGPU check, so the
 * empty state can guide setup instead of letting the first send fail.
 */
export function providerNotice(config: AppConfig): string | null {
  const active = config.providers.find((p) => p.id === config.providerId)
  if (!active) return null
  if (active.requiresKey && !config.keyStatus[active.id])
    return t('noticeNeedsKey', 'Add a provider API key in Settings to start chatting.')
  // WebLLM is the only provider that needs WebGPU (absent on Firefox/macOS by default).
  if (active.id === 'web-llm' && !hasWebGpu())
    return t(
      'noticeNeedsWebgpu',
      'The in-browser model needs WebGPU, which this browser doesn’t expose. Add a cloud provider key in Settings, or enable WebGPU.',
    )
  return null
}
