import { registerLiveEval } from '@/core/chat/live-eval'
import { registerChatPort } from '@/core/chat/port'
import { sweepAttachments } from '@/core/data/attachments/gc'
import { registerSyncAlarm } from '@/core/data/sync/schedule'
import { migrateLegacyMemory, sweepJunkMemories } from '@/core/memory/store/migrate'
import { createMainRouter } from '@/core/messaging/handlers'
import { browser, onActionClick, openSidebar } from '@/platform'
import { createLogger } from '@/shared/util/logger'

const log = createLogger('background')

// The background worker is the only surface allowed to hold secrets and make
// provider calls. It routes one-shot requests and the streaming chat channel.
// ESM output so heavy providers (WebLLM) load as split chunks on demand
// instead of inflating the service-worker bundle.
export default defineBackground({
  type: 'module',
  main() {
    start()
  },
})

function start(): void {
  log.info('service worker started')
  // Live-eval hooks exist only in dev builds (static import: service workers
  // reject dynamic import()); the DEV-false branch tree-shakes the module out
  // of production, so no auto-approving entry point ever ships.
  if (import.meta.env.DEV) registerLiveEval()
  registerChatPort()
  registerSyncAlarm()
  void sweepAttachments() // crash-recovery GC for orphaned attachment blobs
  void migrateLegacyMemory() // one-shot lift of the old remember/recall KV
  void sweepJunkMemories() // drop env-error reflections + empty episodes

  onActionClick((windowId) => {
    if (windowId !== undefined) void openSidebar(windowId)
  })

  const router = createMainRouter()
  browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // Only extension pages (sidepanel/options) may drive the control API. A
    // sender with a tab is a content script inside an untrusted page — its
    // isolated world must never reach keys, history export, or sync (docs/05 T6).
    if (sender.tab) return false
    router(msg).then(sendResponse)
    return true // keep the channel open for the async response
  })
}
