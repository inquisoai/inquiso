import { z } from 'zod'
import { coreMsgs } from './schemas/core'
import {
  ClearAttachmentsMsg,
  HistoryDeleteMsg,
  HistoryExportMsg,
  HistoryGetMsg,
  HistoryImportMsg,
  HistoryListMsg,
} from './schemas/history'
import { memoryMsgs } from './schemas/memory'
import { policyMsgs } from './schemas/policy'
import {
  AddMcpMsg,
  AddProviderMsg,
  ClearCacheMsg,
  GetConfigMsg,
  RemoveApiKeyMsg,
  RemoveMcpMsg,
  RemoveProviderMsg,
  SetApiKeyMsg,
  SetAutonomyMsg,
  SetModelMsg,
  SetProviderMsg,
  SetReasoningMsg,
  SetWebSearchMsg,
} from './schemas/settings'
import {
  ConnectGistMsg,
  ConnectWebdavMsg,
  DisconnectSyncMsg,
  SetSyncModeMsg,
  SyncBackupMsg,
  SyncRestoreMsg,
} from './schemas/sync'
import { SpeakMsg, TranscribeMsg, VoiceReadyMsg } from './schemas/voice'

// Re-export the shared page schema so existing importers keep working.
export { PageContext } from '@/shared/page'

/**
 * The typed, versioned message contract between extension surfaces. Every
 * cross-surface payload is validated with these schemas — never trust a raw
 * message (docs/05-security.md T6). Message definitions live in per-domain
 * messages-*.ts modules; this file composes them into the request union.
 */
/** Discriminated union of every request the background worker accepts. */
export const RequestMsg = z.discriminatedUnion('type', [
  ...coreMsgs,
  GetConfigMsg,
  ClearCacheMsg,
  SetProviderMsg,
  SetModelMsg,
  SetApiKeyMsg,
  RemoveApiKeyMsg,
  AddProviderMsg,
  RemoveProviderMsg,
  SetReasoningMsg,
  SetWebSearchMsg,
  SetAutonomyMsg,
  AddMcpMsg,
  RemoveMcpMsg,
  HistoryListMsg,
  HistoryGetMsg,
  HistoryDeleteMsg,
  HistoryExportMsg,
  HistoryImportMsg,
  ClearAttachmentsMsg,
  VoiceReadyMsg,
  TranscribeMsg,
  SpeakMsg,
  SetSyncModeMsg,
  ConnectWebdavMsg,
  ConnectGistMsg,
  DisconnectSyncMsg,
  SyncBackupMsg,
  SyncRestoreMsg,
  ...memoryMsgs,
  ...policyMsgs,
])
export type RequestMsg = z.infer<typeof RequestMsg>

export const ResponseMsg = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
})
export type ResponseMsg = z.infer<typeof ResponseMsg>
