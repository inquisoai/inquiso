import type { AppConfig } from '@/shared/config'
import type { Conversation } from '@/shared/history'
import { t } from '@/shared/util/i18n'
import { IconButton } from '@/ui/components/IconButton'
import { PencilIcon, SlidersIcon } from '@/ui/components/icons'
import { HistoryMenu } from '@/ui/features/chat/HistoryMenu'
import { ProviderPicker } from '@/ui/features/settings/ProviderPicker'

interface Props {
  config: AppConfig | null
  conversationId: string | null
  onProvider: (id: string) => void
  onModel: (provider: string, modelId: string) => void
  onNewChat: () => void
  onOpenHistory: (c: Conversation) => void
  onSettings: () => void
}

/** Side-panel header: title, model picker, new-chat, history, settings. */
export function AppHeader({
  config,
  conversationId,
  onProvider,
  onModel,
  onNewChat,
  onOpenHistory,
  onSettings,
}: Props) {
  return (
    <header className="flex items-center justify-between gap-2">
      <ProviderPicker
        config={config}
        onProvider={onProvider}
        onModel={onModel}
        onAddKey={onSettings}
      />
      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton label={t('newChat', 'New chat')} onClick={onNewChat}>
          <PencilIcon />
        </IconButton>
        <HistoryMenu currentId={conversationId} onSelect={onOpenHistory} />
        <IconButton label={t('settingsTitle', 'Inquiso settings')} onClick={onSettings}>
          <SlidersIcon />
        </IconButton>
      </div>
    </header>
  )
}
