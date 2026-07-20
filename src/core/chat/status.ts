import type { ProviderStatus } from '@/core/providers/types'
import type { Scope } from '@/shared/constants'

export function unavailableMessage(status: ProviderStatus): string {
  if (status.state === 'downloadable' || status.state === 'downloading') {
    return 'The on-device model is still downloading. Try again shortly, or pick a cloud model.'
  }
  return status.state === 'unavailable' ? status.reason : 'Provider unavailable.'
}

export const readingStatus = (scope: Scope): string =>
  scope === 'page' ? 'Reading the page…' : 'Reading your tabs…'
