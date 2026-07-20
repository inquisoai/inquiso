import type { UIMessage } from 'ai'
import type { Turn } from '@/shared/history'
import type { ToolItem } from '@/shared/trace'

type Part = UIMessage['parts'][number]

const toolState = (t: ToolItem): { state: string; errorText?: string } => {
  if (t.status === 'failed') return { state: 'output-error', errorText: t.error ?? 'failed' }
  if (t.status === 'done') return { state: 'output-available' }
  return { state: 'input-available' }
}

/**
 * Boundary adapter (AI SDK migration plan §4): persisted Inquiso turns →
 * UIMessages, so a useChat panel can load existing conversations. The Inquiso
 * history store stays canonical; this is a read-side view (a write-side
 * `fromUIMessages` is deliberately absent until Phase 4 retires the recorder).
 */
export function toUIMessages(turns: Turn[]): UIMessage[] {
  return turns.map((turn, i) => {
    const parts: Part[] = []
    if (turn.role === 'assistant') {
      for (const item of turn.trace ?? []) {
        if (item.kind === 'reasoning') {
          parts.push({ type: 'reasoning', text: item.text } as Part)
        } else {
          parts.push({
            type: `tool-${item.name}`,
            toolCallId: item.callId,
            input: item.args,
            ...toolState(item),
          } as unknown as Part)
        }
      }
      if (turn.memories?.length) {
        parts.push({ type: 'data-memory', data: turn.memories } as unknown as Part)
      }
    }
    if (turn.content) parts.push({ type: 'text', text: turn.content } as Part)
    return {
      id: `turn-${i}`,
      role: turn.role,
      parts,
      ...(turn.usage ? { metadata: { usage: turn.usage, thinkMs: turn.thinkMs } } : {}),
    } as UIMessage
  })
}
