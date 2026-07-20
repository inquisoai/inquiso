import type { Autonomy } from '@/shared/autonomy'
import type { Scope } from '@/shared/constants'
import type { TabInfo } from '@/shared/page'
import { AutonomySelect } from './AutonomySelect'
import { MicButton } from './MicButton'
import { PlusMenu } from './PlusMenu'
import { SendButton } from './SendButton'

interface Props {
  busy: boolean
  scope: Scope
  tabs: TabInfo[]
  canAttach: boolean
  autonomy: Autonomy
  canSend: boolean
  micEnabled: boolean
  onScope: (s: Scope) => void
  onAutonomy: (a: Autonomy) => void
  onAttach: () => void
  onVoice: (text: string) => void
  onSend: () => void
  onStop: () => void
}

/** The composer's bottom control row: context menu, autonomy, voice, send. */
export function ComposerBar(p: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <PlusMenu
        scope={p.scope}
        tabs={p.tabs}
        canAttach={p.canAttach}
        onScope={p.onScope}
        onAttach={p.onAttach}
      />
      <AutonomySelect value={p.autonomy} onChange={p.onAutonomy} />
      <span className="flex-1" />
      {/* Mic + send form the right-aligned input-action cluster (Gemini style). */}
      <MicButton enabled={p.micEnabled} onText={p.onVoice} />
      <SendButton busy={p.busy} disabled={!p.canSend} onSend={p.onSend} onStop={p.onStop} />
    </div>
  )
}
