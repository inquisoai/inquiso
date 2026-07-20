import type { SubagentDef } from './types'

/** Compares content across the open tabs (e.g. products, articles) and returns
 * a concise side-by-side. Read-only. */
export const comparer: SubagentDef = {
  id: 'comparer',
  description:
    'Delegate a comparison across the open tabs (products, prices, articles). Reads the ' +
    'relevant tabs and returns a concise side-by-side with a recommendation. Read-only.',
  system: [
    'You are a comparison subagent. List the open tabs, read the relevant ones, and compare',
    'them on the dimensions the task asks for. Return a compact side-by-side (a table is ideal)',
    'and a short, reasoned recommendation. Ground every figure in what you read.',
  ].join('\n'),
  toolNames: ['getTabs', 'readTab', 'readTables', 'readPage'],
}
