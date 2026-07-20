import { useEffect, useRef } from 'react'
import { Markdown } from '@/ui/components/Markdown'
import type { SessionState } from '@/ui/features/session/types'
import { useVoice } from '@/ui/hooks/use-voice'
import { AttachmentPreview } from './AttachmentPreview'
import { MemoryUse } from './MemoryUse'
import { MessageActions } from './MessageActions'
import { MessageSources } from './MessageSources'
import { Thoughts } from './Thoughts'
import { Trace } from './Trace'

type Props = Pick<
  SessionState,
  'turns' | 'trace' | 'answer' | 'status' | 'error' | 'busy' | 'budget' | 'memories'
>

const USER_BUBBLE =
  'ml-8 max-w-[85%] self-end whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-surface-2 px-4 py-2.5 text-[15px]'

/** The conversation: completed turns (user bubbles verbatim, assistant answers
 * as markdown), then the live run (trace + streaming answer) at the tail.
 * Sticks to the bottom as new content streams in. */
export function Transcript({ turns, trace, answer, status, error, busy, budget, memories }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  const { ready, speak } = useVoice()

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on stream updates.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [turns.length, answer, trace.length, status, budget])

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto py-2">
      {turns.map((turn, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: turns are append-only.
        <div key={i} className="flex flex-col gap-2">
          {turn.role === 'user' ? (
            <>
              {turn.attachments?.length ? (
                <AttachmentPreview attachments={turn.attachments} />
              ) : null}
              {turn.content.trim() && <p className={USER_BUBBLE}>{turn.content}</p>}
            </>
          ) : (
            <>
              {turn.memories?.length ? <MemoryUse memories={turn.memories} /> : null}
              {turn.trace && turn.trace.length > 0 && (
                <Thoughts
                  trace={turn.trace}
                  busy={false}
                  {...(turn.thinkMs ? { durationMs: turn.thinkMs } : {})}
                  {...(turn.usage ? { tokens: turn.usage.tokens } : {})}
                />
              )}
              <Markdown text={turn.content} className="text-[15px] leading-relaxed" />
              {turn.sources?.length ? <MessageSources sources={turn.sources} /> : null}
              {turn.content && (
                <MessageActions text={turn.content} canSpeak={ready.speak} speak={speak} />
              )}
            </>
          )}
        </div>
      ))}
      {busy && memories.length > 0 && <MemoryUse memories={memories} />}
      <Trace
        trace={trace}
        answer={answer}
        status={status}
        error={error}
        busy={busy}
        budget={budget}
      />
      <div ref={endRef} />
    </div>
  )
}
