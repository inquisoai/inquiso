import type { AppConfig } from '@/shared/config'
import { t } from '@/shared/util/i18n'
import { Button } from '@/ui/components/Button'
import { DashedCard } from '@/ui/components/DashedCard'
import { SettingRow } from '@/ui/components/SettingRow'
import { TextField } from '@/ui/components/TextField'
import { useConnectForm } from '@/ui/hooks/use-connect-form'

interface Props {
  servers: AppConfig['mcpServers']
  onAdd: (spec: { label: string; url: string; token?: string }) => Promise<boolean>
  onRemove: (id: string) => void
}

const FIELDS: ['label' | 'url' | 'token', string, string][] = [
  ['label', 'mcpName', 'Name (e.g. GitHub)'],
  ['url', 'mcpUrl', 'Server URL (https://…)'],
  ['token', 'mcpToken', 'Bearer token (optional)'],
]

/** Connect Model Context Protocol servers (HTTP) to give the agent extra
 * tools. Tools are namespaced by server and pass through the same confirm gate;
 * any token is stored encrypted in the background, never synced. */
export function McpServers({ servers, onAdd, onRemove }: Props) {
  const form = useConnectForm(
    { label: '', url: '', token: '' },
    (v) => {
      const token = v.token.trim()
      return onAdd({ label: v.label.trim(), url: v.url.trim(), ...(token ? { token } : {}) })
    },
    t('mcpFailed', 'Could not add the server. Check the URL and grant access.'),
  )
  const valid = form.v.label.trim() && /^https?:\/\/.+/.test(form.v.url)

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-medium text-sm">{t('mcpTitle', 'MCP servers')}</h3>
      <p className="text-ink-dim text-xs leading-relaxed">
        {t(
          'mcpHint',
          'Connect Model Context Protocol servers to add tools. Their actions pass through the same confirmation gate; tokens are stored encrypted and never leave your device.',
        )}
      </p>
      {servers.map((s) => (
        <SettingRow key={s.id}>
          <span className="min-w-0 truncate text-xs">
            {s.label}
            <span className="text-ink-dim"> — {s.url}</span>
          </span>
          <Button variant="secondary" onClick={() => onRemove(s.id)}>
            {t('remove', 'Remove')}
          </Button>
        </SettingRow>
      ))}
      <DashedCard>
        {FIELDS.map(([k, key, fallback]) => (
          <TextField
            key={k}
            value={form.v[k]}
            onChange={form.set(k)}
            placeholder={t(key, fallback)}
          />
        ))}
        <Button disabled={!valid} onClick={() => void form.submit()}>
          {t('addAndGrant', 'Add & grant access')}
        </Button>
        {form.error && <p className="text-danger text-xs">{form.error}</p>}
      </DashedCard>
    </section>
  )
}
