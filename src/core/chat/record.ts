import type { Turn } from '@/shared/history'
import type { Source, TraceItem, TurnUsage, UsedMemory } from '@/shared/trace'
import type { PortOutbound } from './protocol'

/**
 * Accumulates a streamed run into the fields persisted on the assistant turn,
 * mirroring the UI reducer (session/reducer.ts) so a reloaded turn shows the
 * same trace, sources, thinking time, and cost that were shown live.
 */
export function createTurnRecorder() {
  let content = ''
  let trace: TraceItem[] = []
  const sources: Source[] = []
  let thinkMs: number | undefined
  let usage: TurnUsage | undefined
  let memories: UsedMemory[] = []

  const observe = (msg: PortOutbound): void => {
    switch (msg.type) {
      case 'memory':
        memories = msg.items
        break
      case 'chunk':
        content += msg.text
        break
      case 'reasoning': {
        const last = trace.at(-1)
        if (last?.kind === 'reasoning') last.text += msg.text
        else trace.push({ kind: 'reasoning', text: msg.text })
        break
      }
      case 'tool':
        // Text before a tool call was the plan, not the answer — keep it in the
        // trace as reasoning and reset the answer, exactly as the UI does.
        if (content) trace.push({ kind: 'reasoning', text: content })
        content = ''
        trace.push({
          kind: 'tool',
          callId: msg.callId,
          name: msg.name,
          args: msg.args,
          status: 'running',
        })
        break
      case 'tool-result':
        trace = trace.map((t) =>
          t.kind === 'tool' && t.callId === msg.callId
            ? {
                ...t,
                status: msg.ok ? 'done' : 'failed',
                ...(msg.error ? { error: msg.error } : {}),
              }
            : t,
        )
        break
      case 'source':
        if (!sources.some((s) => s.url === msg.url))
          sources.push({ url: msg.url, ...(msg.title ? { title: msg.title } : {}) })
        break
      case 'budget':
        usage = { tokens: msg.tokens, steps: msg.steps }
        break
      case 'done':
        if (msg.ms) thinkMs = msg.ms
        break
    }
  }

  /** The assistant turn's persisted fields (role added by completeTurn). Empty
   * arrays/absent metrics are omitted so a plain answer stays a plain turn. */
  const result = (): Omit<Turn, 'role'> => ({
    content,
    ...(trace.length ? { trace } : {}),
    ...(sources.length ? { sources } : {}),
    ...(thinkMs ? { thinkMs } : {}),
    ...(usage ? { usage } : {}),
    ...(memories.length ? { memories } : {}),
  })

  return { observe, result }
}
