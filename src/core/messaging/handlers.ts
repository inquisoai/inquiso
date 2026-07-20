import { activePageAccess } from '@/core/context/access'
import { getActivePageContext } from '@/core/context/active-page'
import { resolveScopeTabs } from '@/core/context/scope'
import { sweepAttachments } from '@/core/data/attachments/gc'
import { clearAttachments } from '@/core/data/attachments/store'
import { clearPageCache } from '@/core/data/cache/page-cache'
import {
  addMcp,
  addProvider,
  deleteKey,
  getConfig,
  removeMcp,
  removeProvider,
  saveKey,
  selectModel,
  selectProvider,
  setAutonomy,
  setReasoning,
  setWebSearch,
} from '@/core/data/config/service'
import {
  connectGist,
  connectWebdav,
  disconnectSync,
  setSyncMode,
} from '@/core/data/config/sync-actions'
import { deleteConversation, getConversation, listConversations } from '@/core/data/history/store'
import { exportHistory, importHistory } from '@/core/data/history/transfer'
import { syncBackup, syncRestore } from '@/core/data/sync/service'
import { synthesizeSpeech, transcribeAudio, voiceReady } from '@/core/providers/voice/service'
import { memoryHandlers } from './memory-handlers'
import { createRouter } from './router'

/** The background request router: one handler per message type. Kept out of the
 * entrypoint so the handler map can grow without bloating background.ts. */
export function createMainRouter() {
  return createRouter({
    ping: async () => 'pong',
    pageAccess: () => activePageAccess(),
    getPageContext: () => getActivePageContext(),
    getConfig: () => getConfig(),
    setProvider: (m) => selectProvider(m.providerId),
    setModel: (m) => selectModel(m.provider, m.modelId),
    setApiKey: (m) => saveKey(m.provider, m.apiKey),
    removeApiKey: (m) => deleteKey(m.provider),
    clearCache: async () => {
      clearPageCache()
      return true
    },
    historyList: () => listConversations(),
    historyGet: (m) => getConversation(m.id),
    historyDelete: (m) =>
      deleteConversation(m.id)
        .then(sweepAttachments)
        .then(() => true),
    historyExport: () => exportHistory(),
    historyImport: (m) => importHistory(m.data),
    clearAttachments: () => clearAttachments().then(() => true),
    addProvider: (m) =>
      addProvider({
        label: m.label,
        baseURL: m.baseURL,
        model: m.model,
        requiresKey: m.requiresKey,
      }),
    removeProvider: (m) => removeProvider(m.id),
    scopeTabs: async (m) =>
      (await resolveScopeTabs(m.scope)).map((t) => ({ title: t.title ?? '', url: t.url ?? '' })),
    setReasoning: (m) => setReasoning(m.enabled),
    setWebSearch: (m) => setWebSearch(m.enabled),
    setAutonomy: (m) => setAutonomy(m.autonomy),
    addMcp: (m) => addMcp({ label: m.label, url: m.url, ...(m.token ? { token: m.token } : {}) }),
    removeMcp: (m) => removeMcp(m.id),
    voiceReady: () => voiceReady(),
    transcribe: (m) => transcribeAudio(m.audio),
    speak: (m) => synthesizeSpeech(m.text),
    setSyncMode: (m) => setSyncMode(m.mode),
    connectWebdav: (m) => connectWebdav(m.url, m.user, m.password),
    connectGist: (m) => connectGist(m.token),
    disconnectSync: () => disconnectSync(),
    syncBackup: () => syncBackup(),
    syncRestore: () => syncRestore(),
    ...memoryHandlers,
  })
}
