import { useState } from 'react'
import type { AppConfig } from '@/shared/config'
import type { SyncMode, SyncStatus, WebdavCredentials } from '@/shared/sync'
import { t } from '@/shared/util/i18n'
import { Button } from '@/ui/components/Button'
import { Select } from '@/ui/components/Select'
import { SettingRow } from '@/ui/components/SettingRow'
import { SyncConnect } from './SyncConnect'

interface Props {
  sync: AppConfig['sync']
  setSyncMode: (m: SyncMode) => void
  connectWebdav: (s: WebdavCredentials) => Promise<boolean>
  connectGist: (token: string) => Promise<boolean>
  disconnectSync: () => void
  backup: () => Promise<SyncStatus>
  restore: () => Promise<{ imported: number }>
}

/** Cloud-backup config: pick a provider + manual/auto backup, back up/restore.
 * BYO cloud, never an Inquiso server (docs/adr/0004). */
export function SyncSettings(p: Props) {
  const { sync, setSyncMode, connectWebdav, connectGist, disconnectSync, backup, restore } = p
  const [msg, setMsg] = useState('')
  const connected = sync.providerId !== null
  const gist = sync.providerId === 'gist'
  const detail = gist ? t('gistPrivate', 'private gist') : (sync.webdavUrl ?? '')
  const doBackup = async (): Promise<void> => {
    setMsg(t('backingUp', 'Backing up…'))
    try {
      await backup()
      setMsg(t('backupDone', 'Backed up.'))
    } catch {
      setMsg(t('backupFailed', 'Backup failed — check the connection.'))
    }
  }
  const doRestore = async (): Promise<void> => {
    setMsg(t('restoring', 'Restoring…'))
    const { imported } = await restore().catch(() => ({ imported: -1 }))
    setMsg(
      imported < 0
        ? t('restoreFailed', 'Restore failed.')
        : `${t('imported', 'Imported')} ${imported}`,
    )
  }
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-medium text-sm">{t('syncTitle', 'Cloud backup')}</h3>
      <p className="text-ink-dim text-xs leading-relaxed">
        {t(
          'syncHint',
          'Back up your chats to your own cloud storage — never an Inquiso server. Credentials are stored encrypted on your device.',
        )}
      </p>
      <SettingRow>
        <span className="text-ink-dim text-xs">{t('syncMode', 'Backup')}</span>
        <Select
          value={sync.mode}
          onChange={(v) => setSyncMode(v as SyncMode)}
          wrapClassName="shrink-0"
          className="border border-line bg-surface"
        >
          <option value="manual">{t('syncManual', 'Manual')}</option>
          <option value="auto">{t('syncAuto', 'Automatic')}</option>
        </Select>
      </SettingRow>
      {connected ? (
        <div className="flex flex-col gap-2">
          <SettingRow>
            <span className="min-w-0 truncate text-xs">
              {gist ? 'GitHub Gist' : 'WebDAV'}
              <span className="text-ink-dim"> — {detail}</span>
            </span>
            <Button variant="secondary" onClick={disconnectSync}>
              {t('disconnect', 'Disconnect')}
            </Button>
          </SettingRow>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => void doBackup()}>
              {t('backupNow', 'Back up now')}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => void doRestore()}>
              {t('restore', 'Restore')}
            </Button>
          </div>
          {(msg || sync.lastBackupAt) && (
            <p className="text-ink-dim text-xs">
              {msg ||
                `${t('lastBackup', 'Last backup')}: ${new Date(sync.lastBackupAt ?? 0).toLocaleString()}`}
            </p>
          )}
        </div>
      ) : (
        <SyncConnect connectWebdav={connectWebdav} connectGist={connectGist} />
      )}
    </section>
  )
}
