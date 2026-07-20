import type { SubagentDef } from './types'

/** Assesses a page's trustworthiness — Inquiso's signature capability, run as
 * a focused specialist so the main answer stays clean. Read-only. */
export const trustAuditor: SubagentDef = {
  id: 'trust_auditor',
  description:
    'Delegate a trustworthiness assessment of the current page. Returns a verdict with the ' +
    'source/author, supporting evidence, tone/bias, and claims to verify. Read-only.',
  system: [
    'You are a trust-auditing subagent. Assess how trustworthy the page is.',
    'Use the page tools to check the source/author, citations and evidence, tone and bias,',
    'and page metadata. Ground each point in what you find; quote the smallest supporting',
    'phrase. Return a short verdict, the key signals, and any claims the reader should verify.',
  ].join('\n'),
  toolNames: ['readPage', 'getMetadata', 'listLinks', 'queryElements'],
}
