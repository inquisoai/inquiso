import { useState } from 'react'
import { SYNC_PROVIDERS, type SyncProviderId, type WebdavCredentials } from '@/shared/sync'
import { t } from '@/shared/util/i18n'
import { Select } from '@/ui/components/Select'
import { SettingRow } from '@/ui/components/SettingRow'
import { GistForm } from './GistForm'
import { WebdavForm } from './WebdavForm'

const LABELS: Record<SyncProviderId, string> = {
  gist: 'GitHub Gist (private)',
  webdav: 'WebDAV (Nextcloud, ownCloud…)',
}

interface Props {
  connectWebdav: (s: WebdavCredentials) => Promise<boolean>
  connectGist: (token: string) => Promise<boolean>
}

/** Provider picker shown when backup isn't set up: choose a destination, then
 * fill its connect form. Both providers need zero OAuth-app registration. */
export function SyncConnect({ connectWebdav, connectGist }: Props) {
  const [id, setId] = useState<SyncProviderId>('gist')
  return (
    <div className="flex flex-col gap-2">
      <SettingRow>
        <span className="text-ink-dim text-xs">{t('syncProvider', 'Provider')}</span>
        <Select
          value={id}
          onChange={(v) => setId(v as SyncProviderId)}
          wrapClassName="shrink-0"
          className="border border-line bg-surface"
        >
          {SYNC_PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {LABELS[p]}
            </option>
          ))}
        </Select>
      </SettingRow>
      {id === 'webdav' ? (
        <WebdavForm onConnect={connectWebdav} />
      ) : (
        <GistForm onConnect={connectGist} />
      )}
    </div>
  )
}
