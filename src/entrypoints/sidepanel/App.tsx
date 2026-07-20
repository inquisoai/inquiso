import { useEffect, useState } from 'react'
import { type Autonomy, DEFAULT_AUTONOMY } from '@/shared/autonomy'
import type { Scope } from '@/shared/constants'
import { AppHeader } from '@/ui/features/chat/AppHeader'
import { ChatV2 } from '@/ui/features/chat/ChatV2'
import { ConfirmPrompt } from '@/ui/features/chat/ConfirmPrompt'
import { Composer } from '@/ui/features/chat/composer/Composer'
import { EmptyState } from '@/ui/features/chat/EmptyState'
import { PageAccessNotice } from '@/ui/features/chat/PageAccessNotice'
import { ShareBar } from '@/ui/features/chat/ShareBar'
import { Transcript } from '@/ui/features/chat/transcript/Transcript'
import { SettingsView } from '@/ui/features/settings/SettingsView'
import { chatV2Enabled } from '@/ui/hooks/use-chat-v2'
import { useConfig } from '@/ui/hooks/use-config'
import { usePageAccess } from '@/ui/hooks/use-page-access'
import { useScopeTabs } from '@/ui/hooks/use-scope-tabs'
import { useSession } from '@/ui/hooks/use-session'

/** Side panel: one composer + conversation, stored sessions, in-panel settings.
 * `inquisoChatV2` flag renders the experimental useChat panel instead. */
export function App() {
  if (chatV2Enabled()) return <ChatV2 />
  return <AppV1 />
}

function AppV1() {
  const s = useSession()
  const cfg = useConfig()
  const [scope, setScope] = useState<Scope>('page')
  const [view, setView] = useState<'chat' | 'settings'>('chat')
  const [autonomy, setAutonomy] = useState<Autonomy>(DEFAULT_AUTONOMY)
  const tabs = useScopeTabs(scope)
  const page = usePageAccess()
  const empty = !s.turns.length && !s.trace.length && !s.answer && !s.status && !s.error
  const canAttach =
    cfg.config?.providers.find((p) => p.id === cfg.config?.providerId)?.files ?? false

  // Seed the per-run autonomy from the saved default once config loads.
  const savedAutonomy = cfg.config?.autonomy
  useEffect(() => {
    if (savedAutonomy) setAutonomy(savedAutonomy)
  }, [savedAutonomy])

  if (view === 'settings') {
    return (
      <main className="flex h-screen flex-col px-3 pt-2 pb-3">
        <SettingsView {...cfg} onBack={() => setView('chat')} />
      </main>
    )
  }

  return (
    <main className="flex h-screen flex-col gap-2 px-3 pt-2 pb-3">
      <AppHeader
        config={cfg.config}
        conversationId={s.conversationId}
        onProvider={cfg.setProvider}
        onModel={cfg.setModel}
        onNewChat={s.reset}
        onOpenHistory={s.load}
        onSettings={() => setView('settings')}
      />
      {empty ? (
        <EmptyState
          onSuggest={(q) => s.send(q, scope)}
          config={cfg.config}
          onOpenSettings={() => setView('settings')}
        />
      ) : (
        <Transcript
          turns={s.turns}
          trace={s.trace}
          answer={s.answer}
          status={s.status}
          error={s.error}
          busy={s.busy}
          budget={s.budget}
          memories={s.memories}
        />
      )}
      {s.confirms.map((c) => (
        <ConfirmPrompt key={c.id} req={c} onResolve={s.confirm} />
      ))}
      <PageAccessNotice access={page.access} onGrant={() => void page.grant()} />
      <ShareBar tabs={tabs} />
      <Composer
        busy={s.busy}
        scope={scope}
        tabs={tabs}
        canAttach={canAttach}
        autonomy={autonomy}
        onScope={setScope}
        onAutonomy={setAutonomy}
        onSend={(text, attachments) => s.send(text, scope, attachments, autonomy)}
        onStop={s.stop}
      />
    </main>
  )
}
