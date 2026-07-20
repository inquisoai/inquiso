import { useState } from 'react'
import { t } from '@/shared/util/i18n'
import { IconButton } from '@/ui/components/IconButton'
import { ArrowLeftIcon } from '@/ui/components/icons'
import { MemoryPanel } from '@/ui/features/memory/MemoryPanel'
import type { useConfig } from '@/ui/hooks/use-config'
import { McpServers } from './McpServers'
import { PermissionsSettings } from './PermissionsSettings'
import { ProvidersPanel } from './providers/ProvidersPanel'
import { RunSettings } from './RunSettings'
import { type SettingsTab, SettingsTabs } from './SettingsTabs'
import { SyncSettings } from './sync/SyncSettings'

type Props = ReturnType<typeof useConfig> & { onBack?: () => void }

/** The settings surface (side panel + Options page), organised into tabs:
 * Models (providers/keys), Agent (run behaviour), Access (permissions), MCP. */
export function SettingsView(props: Props) {
  const { config, onBack } = props
  const [tab, setTab] = useState<SettingsTab>('models')
  if (!config) return <p className="p-4 text-ink-dim text-sm">{t('loading', 'Loading…')}</p>

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-auto pb-1">
      <div className="flex items-center gap-1">
        {onBack && (
          <IconButton label={t('back', 'Back')} onClick={onBack}>
            <ArrowLeftIcon />
          </IconButton>
        )}
        <h2 className="font-semibold text-base">{t('settingsTitle', 'Inquiso settings')}</h2>
      </div>
      <SettingsTabs value={tab} onChange={setTab} />

      {tab === 'models' && <ProvidersPanel {...props} config={config} />}
      {tab === 'agent' && (
        <RunSettings
          config={config}
          setAutonomy={(a) => void props.setAutonomy(a)}
          setReasoning={(v) => void props.setReasoning(v)}
          setWebSearch={(v) => void props.setWebSearch(v)}
          clearCache={() => void props.clearCache()}
          clearAttachments={() => void props.clearAttachments()}
        />
      )}
      {tab === 'memory' && <MemoryPanel />}
      {tab === 'permissions' && <PermissionsSettings />}
      {tab === 'mcp' && (
        <McpServers
          servers={config.mcpServers}
          onAdd={props.addMcp}
          onRemove={(id) => void props.removeMcp(id)}
        />
      )}
      {tab === 'sync' && (
        <SyncSettings
          sync={config.sync}
          setSyncMode={props.setSyncMode}
          connectWebdav={props.connectWebdav}
          connectGist={props.connectGist}
          disconnectSync={() => void props.disconnectSync()}
          backup={props.backup}
          restore={props.restore}
        />
      )}
    </div>
  )
}
