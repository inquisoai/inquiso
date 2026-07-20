import { t } from '@/shared/util/i18n'
import { Button } from '@/ui/components/Button'
import { DashedCard } from '@/ui/components/DashedCard'
import { TextField } from '@/ui/components/TextField'
import { useConnectForm } from '@/ui/hooks/use-connect-form'

interface Props {
  onConnect: (token: string) => Promise<boolean>
}

/**
 * Connect GitHub Gist backup: paste a personal access token with the `gist`
 * scope (github.com/settings/tokens). No OAuth app to register — a private gist
 * holds the backup. The token is stored encrypted and sent only to GitHub.
 */
export function GistForm({ onConnect }: Props) {
  const form = useConnectForm(
    { token: '' },
    (v) => onConnect(v.token.trim()),
    t('gistFailed', 'Could not connect. Check the token has the gist scope.'),
  )
  return (
    <DashedCard>
      <p className="text-ink-dim text-xs leading-relaxed">
        {t(
          'gistHint',
          'Create a token with the “gist” scope at github.com/settings/tokens, then paste it here.',
        )}
      </p>
      <TextField
        type="password"
        value={form.v.token}
        onChange={form.set('token')}
        placeholder={t('gistToken', 'Personal access token (gist scope)')}
      />
      <Button disabled={!form.v.token.trim()} onClick={() => void form.submit()}>
        {t('connectGrant', 'Connect & grant access')}
      </Button>
      {form.error && <p className="text-danger text-xs">{form.error}</p>}
    </DashedCard>
  )
}
