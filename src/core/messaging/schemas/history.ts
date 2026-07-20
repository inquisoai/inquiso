import { z } from 'zod'
import { PROTOCOL_VERSION } from '@/shared/constants'

// Conversation-history messages, split out of contract.ts to keep files within
// the line cap. Composed into RequestMsg there.
const base = z.object({ v: z.literal(PROTOCOL_VERSION) })

export const HistoryListMsg = base.extend({ type: z.literal('historyList') })
export const HistoryGetMsg = base.extend({ type: z.literal('historyGet'), id: z.string() })
export const HistoryDeleteMsg = base.extend({ type: z.literal('historyDelete'), id: z.string() })
export const HistoryExportMsg = base.extend({ type: z.literal('historyExport') })
export const HistoryImportMsg = base.extend({ type: z.literal('historyImport'), data: z.unknown() })
export const ClearAttachmentsMsg = base.extend({ type: z.literal('clearAttachments') })
