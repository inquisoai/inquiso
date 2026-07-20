import type { UIMessage } from 'ai'
import type { UsedMemory } from '@/shared/trace'
import { Markdown } from '@/ui/components/Markdown'
import { MemoryUse } from './transcript/MemoryUse'

const TOOL_STATE_ICON: Record<string, string> = {
  'output-available': '✓',
  'output-error': '✕',
  'input-available': '…',
  'input-streaming': '…',
}

/** Renders a UIMessage's typed parts: markdown text, dimmed reasoning, tool
 * lines with state, and persisted memory chips (data-memory parts). */
export function ChatV2Parts({ message }: { message: UIMessage }) {
  return (
    <>
      {message.parts.map((p, i) => {
        const key = `${message.id}-${i}`
        if (p.type === 'text') {
          return <Markdown key={key} text={p.text} className="text-[15px] leading-relaxed" />
        }
        if (p.type === 'reasoning') {
          return (
            <p key={key} className="text-ink-dim text-xs italic">
              {p.text}
            </p>
          )
        }
        if (p.type === 'data-memory') {
          return <MemoryUse key={key} memories={p.data as UsedMemory[]} />
        }
        if (p.type.startsWith('tool-')) {
          const tool = p as { type: string; state: string; errorText?: string }
          return (
            <p key={key} className="text-ink-dim text-xs">
              {TOOL_STATE_ICON[tool.state] ?? '…'} {tool.type.slice(5)}
              {tool.errorText ? ` — ${tool.errorText}` : ''}
            </p>
          )
        }
        return null
      })}
    </>
  )
}
