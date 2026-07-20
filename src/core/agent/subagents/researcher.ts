import type { SubagentDef } from './types'

/** Reads and cross-checks page content to answer a focused sub-question,
 * keeping that back-and-forth out of the main conversation. Read-only. */
export const researcher: SubagentDef = {
  id: 'researcher',
  description:
    'Delegate a focused research sub-question about the current page(s). The researcher ' +
    'reads and inspects the page and returns a concise, sourced finding. Read-only.',
  system: [
    'You are a research subagent. Answer the given sub-question using only the page tools.',
    'Read the page, locate relevant elements, and ground every claim in what you find —',
    'quote the smallest supporting phrase. Be concise; return just the finding, no preamble.',
  ].join('\n'),
  toolNames: ['readPage', 'queryElements'],
}
