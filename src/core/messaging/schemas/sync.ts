import { z } from 'zod'
import { PROTOCOL_VERSION } from '@/shared/constants'
import { SYNC_MODES } from '@/shared/sync'

// Cloud-backup messages, split out of contract.ts to keep files within the cap.
const base = z.object({ v: z.literal(PROTOCOL_VERSION) })

export const SetSyncModeMsg = base.extend({
  type: z.literal('setSyncMode'),
  mode: z.enum(SYNC_MODES),
})
export const ConnectWebdavMsg = base.extend({
  type: z.literal('connectWebdav'),
  url: z.string().url(),
  user: z.string().max(200),
  password: z.string().min(1).max(400),
})
export const ConnectGistMsg = base.extend({
  type: z.literal('connectGist'),
  token: z.string().min(1).max(400),
})
export const DisconnectSyncMsg = base.extend({ type: z.literal('disconnectSync') })
export const SyncBackupMsg = base.extend({ type: z.literal('syncBackup') })
export const SyncRestoreMsg = base.extend({ type: z.literal('syncRestore') })
