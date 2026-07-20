import type { SessionState } from './types'

/**
 * 'done': the finished answer becomes a turn, keeping its reasoning/tool
 * trace, sources, cost, and used memories — then the live area resets.
 */
export function finishTurn(s: SessionState, ms?: number): SessionState {
  return {
    ...s,
    busy: false,
    status: '',
    turns: s.answer
      ? [
          ...s.turns,
          {
            role: 'assistant',
            content: s.answer,
            ...(s.trace.length ? { trace: s.trace } : {}),
            ...(ms ? { thinkMs: ms } : {}),
            ...(s.sources.length ? { sources: s.sources } : {}),
            ...(s.budget ? { usage: { tokens: s.budget.tokens, steps: s.budget.steps } } : {}),
            ...(s.memories.length ? { memories: s.memories } : {}),
          },
        ]
      : s.turns,
    answer: '',
    trace: [],
    sources: [],
    memories: [],
    budget: null,
  }
}
