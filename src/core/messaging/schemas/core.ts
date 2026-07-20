import { z } from 'zod'
import { PROTOCOL_VERSION, SCOPES } from '@/shared/constants'

// Core page/tab messages, split out of contract.ts to keep files within the
// line cap. Composed into RequestMsg there.
const base = z.object({ v: z.literal(PROTOCOL_VERSION) })

export const PingMsg = base.extend({ type: z.literal('ping') })
export const GetPageContextMsg = base.extend({
  type: z.literal('getPageContext'),
  scope: z.enum(SCOPES),
})
export const ScopeTabsMsg = base.extend({ type: z.literal('scopeTabs'), scope: z.enum(SCOPES) })
/** Can the active tab's page be read right now (activeTab / host grant)? */
export const PageAccessMsg = base.extend({ type: z.literal('pageAccess') })

export const coreMsgs = [PingMsg, GetPageContextMsg, ScopeTabsMsg, PageAccessMsg] as const
