import { useState } from 'react'
import { t } from '@/shared/util/i18n'
import { Button } from '@/ui/components/Button'
import { PlusIcon } from '@/ui/components/icons'
import { TextField } from '@/ui/components/TextField'
import { useConnectForm } from '@/ui/hooks/use-connect-form'

interface Props {
  onAdd: (spec: {
    label: string
    baseURL: string
    model: string
    requiresKey: boolean
  }) => Promise<boolean>
}

const FIELDS: ['label' | 'baseURL' | 'model', string, string][] = [
  ['label', 'providerName', 'Name (e.g. Groq)'],
  ['baseURL', 'baseUrl', 'Base URL (…/v1)'],
  ['model', 'modelIdPlaceholder', 'model id'],
]

/** Adds any OpenAI-compatible provider: a gateway, a self-hosted endpoint, or
 * a local server (Ollama/LM Studio). localhost URLs need no key. */
export function AddProviderForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1)/.test(url)
  const form = useConnectForm(
    { label: '', baseURL: '', model: '' },
    (v) =>
      onAdd({
        label: v.label.trim(),
        baseURL: v.baseURL.trim(),
        model: v.model.trim(),
        requiresKey: !isLocal(v.baseURL),
      }),
    t('addProviderFailed', 'Could not add. Check the URL and grant access.'),
  )
  const valid = form.v.label.trim() && /^https?:\/\/.+/.test(form.v.baseURL) && form.v.model.trim()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 rounded-2xl border border-line border-dashed py-3 text-ink-dim text-sm transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <PlusIcon />
        {t('addProvider', 'Add a provider')}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-brand/40 p-3.5">
      <p className="font-medium text-sm">{t('addProvider', 'Add a provider')}</p>
      <p className="text-ink-dim text-xs leading-relaxed">
        {t(
          'addProviderHint',
          'Any OpenAI-compatible endpoint — a gateway, your own server, or a local model. Local URLs need no key.',
        )}
      </p>
      {FIELDS.map(([k, key, fallback]) => (
        <TextField
          key={k}
          value={form.v[k]}
          onChange={form.set(k)}
          placeholder={t(key, fallback)}
        />
      ))}
      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!valid}
          onClick={() => void form.submit().then((ok) => ok && setOpen(false))}
        >
          {isLocal(form.v.baseURL) ? t('add', 'Add') : t('addAndGrant', 'Add & grant access')}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          {t('cancel', 'Cancel')}
        </Button>
      </div>
      {form.error && <p className="text-danger text-xs">{form.error}</p>}
    </div>
  )
}
