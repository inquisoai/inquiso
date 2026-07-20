import { type ModelMessage, pruneMessages } from 'ai'

/** How many trailing messages to keep verbatim — the model's live working set
 * (the page/tool results it is currently reasoning about). */
const KEEP = 2

/**
 * Per-step context compaction. Web pages are token-monsters, so a multi-step
 * browser run blows the context window fast. Between steps we strip the raw
 * payloads of older tool calls and stale reasoning while keeping the two most
 * recent messages intact — long runs stay cheap and within budget without
 * losing the immediate working set. Assistant summaries/answers are preserved;
 * only bulky tool output and old thoughts are dropped.
 */
export function compactStep({
  stepNumber,
  messages,
}: {
  stepNumber: number
  messages: ModelMessage[]
}): { messages?: ModelMessage[] } {
  if (stepNumber === 0) return {}
  return {
    messages: pruneMessages({
      messages,
      toolCalls: `before-last-${KEEP}-messages`,
      reasoning: 'before-last-message',
      emptyMessages: 'remove',
    }),
  }
}
