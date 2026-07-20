import { friendlyError } from '../errors'
import type { AgentEmit } from '../types'

/** A loosely-typed slice of the AI SDK v6 `fullStream` parts we care about. */
export interface Part {
  type: string
  text?: string
  toolCallId?: string
  toolName?: string
  input?: unknown
  output?: unknown
  error?: unknown
  /** URL sources from provider web search (part.type === 'source'). */
  sourceType?: string
  url?: string
  title?: string
}

/** Maps one stream part to a trace event for the side panel. */
export function relay(part: Part, emit: AgentEmit): void {
  switch (part.type) {
    case 'text-delta':
      if (part.text) emit({ type: 'chunk', text: part.text })
      break
    case 'reasoning-delta':
      if (part.text) emit({ type: 'reasoning', text: part.text })
      break
    case 'tool-call':
      emit({
        type: 'tool',
        callId: part.toolCallId ?? '',
        name: part.toolName ?? '',
        args: part.input,
      })
      break
    case 'tool-result': {
      const r = part.output as { ok?: boolean; error?: string } | undefined
      emit({
        type: 'tool-result',
        callId: part.toolCallId ?? '',
        ok: r?.ok ?? true,
        ...(r?.error ? { error: r.error } : {}),
      })
      break
    }
    case 'tool-error':
      emit({
        type: 'tool-result',
        callId: part.toolCallId ?? '',
        ok: false,
        error: String(part.error),
      })
      break
    case 'source':
      // Web-search grounding: surface URL sources as citations.
      if (part.sourceType === 'url' && part.url) {
        emit({ type: 'source', url: part.url, ...(part.title ? { title: part.title } : {}) })
      }
      break
    case 'error':
      emit({ type: 'error', error: friendlyError(part.error) })
      break
  }
}
