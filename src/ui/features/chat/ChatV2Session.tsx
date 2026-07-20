import { useState } from 'react'
import { AUTONOMY_LEVELS, type Autonomy } from '@/shared/autonomy'
import { SCOPES, type Scope } from '@/shared/constants'
import { t } from '@/shared/util/i18n'
import { type ChatV2Init, useChatV2 } from '@/ui/hooks/use-chat-v2'
import { ChatV2Parts } from './ChatV2Parts'
import { ConfirmPrompt } from './ConfirmPrompt'
import { MemoryUse } from './transcript/MemoryUse'

/** The AI SDK-owned session: useChat messages/status/stop over the Port
 * transport, with scope/autonomy per send and out-of-band confirms/memory. */
export function ChatV2Session({ init }: { init: ChatV2Init }) {
  const chat = useChatV2(init)
  const [input, setInput] = useState('')
  const [scope, setScope] = useState<Scope>('page')
  const [autonomy, setAutonomy] = useState<Autonomy>('scope')

  const send = (): void => {
    if (!input.trim()) return
    void chat.sendMessage({ text: input }, { body: { scope, autonomy } })
    setInput('')
  }
  const busy = chat.status === 'streaming' || chat.status === 'submitted'
  const select = 'rounded-lg border border-line bg-surface-2 px-1.5 py-1 text-xs'

  return (
    <main className="flex h-screen flex-col gap-2 px-3 pt-2 pb-3">
      <p className="text-[11px] text-ink-dim">useChat preview (experimental)</p>
      <div className="flex flex-1 flex-col gap-3 overflow-auto">
        {chat.messages.map((m) => (
          <div
            key={m.id}
            className={m.role === 'user' ? 'self-end rounded-2xl bg-surface-2 px-3 py-2' : ''}
          >
            <ChatV2Parts message={m} />
          </div>
        ))}
        {busy && chat.memories.length > 0 && <MemoryUse memories={chat.memories} />}
        {chat.statusLine && <p className="text-ink-dim text-sm">{chat.statusLine}</p>}
        {chat.error && <p className="text-red-600 text-sm">{String(chat.error.message)}</p>}
      </div>
      {chat.confirms.map((c) => (
        <ConfirmPrompt key={c.id} req={c} onResolve={chat.confirm} />
      ))}
      <div className="flex gap-2">
        <select
          className={select}
          value={scope}
          onChange={(e) => setScope(e.target.value as Scope)}
        >
          {SCOPES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className={select}
          value={autonomy}
          onChange={(e) => setAutonomy(e.target.value as Autonomy)}
        >
          {AUTONOMY_LEVELS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={t('askPlaceholder', 'Ask about this page…')}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm"
        />
        <button
          type="button"
          className="rounded-xl bg-ink px-3 text-surface text-sm"
          onClick={busy ? () => void chat.stop() : send}
        >
          {busy ? t('stop', 'Stop') : t('send', 'Send')}
        </button>
      </div>
    </main>
  )
}
