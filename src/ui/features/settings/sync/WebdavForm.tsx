import type { WebdavCredentials } from '@/shared/sync'
import { t } from '@/shared/util/i18n'
import { Button } from '@/ui/components/Button'
import { DashedCard } from '@/ui/components/DashedCard'
import { TextField } from '@/ui/components/TextField'
import { useConnectForm } from '@/ui/hooks/use-connect-form'

interface Props {
  onConnect: (s: WebdavCredentials) => Promise<boolean>
}

const FIELDS: [keyof WebdavCredentials, string, string, string][] = [
  ['url', 'webdavUrl', 'File URL (…/inquiso.json)', 'url'],
  ['user', 'webdavUser', 'Username', 'text'],
  ['password', 'webdavPass', 'App password', 'password'],
]

/** Connect a WebDAV endpoint (Nextcloud/ownCloud/…): a file URL, username, and
 * app password. The password is sent to the background and stored encrypted;
 * connecting also grants the endpoint's origin. */
export function WebdavForm({ onConnect }: Props) {
  const form = useConnectForm(
    { url: '', user: '', password: '' },
    (v) => onConnect({ url: v.url.trim(), user: v.user.trim(), password: v.password }),
    t('webdavFailed', 'Could not connect. Check the URL and credentials.'),
  )
  const valid = /^https?:\/\/.+/.test(form.v.url) && form.v.password.trim()

  return (
    <DashedCard>
      {FIELDS.map(([k, key, fallback, type]) => (
        <TextField
          key={k}
          type={type}
          value={form.v[k]}
          onChange={form.set(k)}
          placeholder={t(key, fallback)}
        />
      ))}
      <Button disabled={!valid} onClick={() => void form.submit()}>
        {t('connectGrant', 'Connect & grant access')}
      </Button>
      {form.error && <p className="text-danger text-xs">{form.error}</p>}
    </DashedCard>
  )
}
