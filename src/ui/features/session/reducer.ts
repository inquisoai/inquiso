import type { PortOutbound } from '@/core/chat/protocol'
import { finishTurn } from './finish'
import type { SessionState, Source, TraceItem } from './types'

export const INITIAL: SessionState = {
  turns: [],
  answer: '',
  trace: [],
  sources: [],
  memories: [],
  status: '',
  busy: false,
  error: null,
  confirms: [],
  budget: null,
}

/** Accumulates streamed reasoning deltas into a single trailing trace item. */
function addReasoning(trace: TraceItem[], text: string): TraceItem[] {
  const last = trace.at(-1)
  if (last?.kind === 'reasoning')
    return [...trace.slice(0, -1), { ...last, text: last.text + text }]
  return [...trace, { kind: 'reasoning', text }]
}
/** Appends a source to the list, de-duplicated by URL. */
const addSource = (list: Source[], url: string, title?: string): Source[] =>
  list.some((x) => x.url === url) ? list : [...list, { url, ...(title ? { title } : {}) }]

export function reduce(s: SessionState, msg: PortOutbound): SessionState {
  switch (msg.type) {
    case 'status':
      return { ...s, status: msg.status }
    case 'chunk':
      return { ...s, answer: s.answer + msg.text, status: '' }
    case 'reasoning':
      return { ...s, trace: addReasoning(s.trace, msg.text) }
    case 'budget':
      return { ...s, budget: { steps: msg.steps, ms: msg.ms, tokens: msg.tokens } }
    case 'source':
      return { ...s, sources: addSource(s.sources, msg.url, msg.title) }
    // Text streamed before a tool call is the plan — move it into the trace.
    case 'tool': {
      const trace = s.answer
        ? [...s.trace, { kind: 'reasoning' as const, text: s.answer }]
        : s.trace
      return {
        ...s,
        answer: '',
        trace: [
          ...trace,
          { kind: 'tool', callId: msg.callId, name: msg.name, args: msg.args, status: 'running' },
        ],
      }
    }
    case 'tool-result':
      return {
        ...s,
        trace: s.trace.map((t) =>
          t.kind === 'tool' && t.callId === msg.callId
            ? {
                ...t,
                status: msg.ok ? 'done' : 'failed',
                ...(msg.error ? { error: msg.error } : {}),
              }
            : t,
        ),
      }
    case 'confirm':
      return { ...s, confirms: [...s.confirms, { id: msg.id, tool: msg.tool, args: msg.args }] }
    case 'memory':
      return { ...s, memories: msg.items }
    case 'done':
      return finishTurn(s, msg.ms)
    case 'error':
      return { ...s, busy: false, status: '', error: msg.error, budget: null }
    // conversationId is tracked by the hook; 'ui' chunks feed the useChat
    // transport (dual protocol), not this reducer.
    case 'meta':
    case 'ui':
      return s
  }
}
