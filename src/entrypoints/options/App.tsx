import { SettingsView } from '@/ui/features/settings/SettingsView'
import { useConfig } from '@/ui/hooks/use-config'

/** Options page: the same SettingsView the side panel shows in-panel —
 * BYOK + opt-in OAuth model (docs/03-providers-and-auth.md). */
export function App() {
  const cfg = useConfig()
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col p-8">
      <SettingsView {...cfg} />
    </main>
  )
}
