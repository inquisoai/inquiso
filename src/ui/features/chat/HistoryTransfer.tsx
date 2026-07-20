import { useRef } from 'react'
import type { HistoryExport } from '@/shared/history'
import { t } from '@/shared/util/i18n'
import { useHistoryImport } from '@/ui/hooks/use-history'
import { sendToBackground } from '@/ui/lib/messaging'

/**
 * Export all conversations to a JSON file, or import one — the serverless way
 * to move chats between browsers/profiles. Import never overwrites (each chat
 * comes in with a fresh id) and invalidates the cached history list.
 */
export function HistoryTransfer() {
  const fileRef = useRef<HTMLInputElement>(null)
  const importHistory = useHistoryImport()

  const exportAll = async (): Promise<void> => {
    const data = await sendToBackground<HistoryExport>({ type: 'historyExport' })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inquiso-chats-${new Date(data.exportedAt).toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      await importHistory(JSON.parse(await file.text()))
    } catch {
      // Invalid or corrupt file — ignore silently.
    }
  }

  const btn = 'flex-1 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-surface-2'
  return (
    <div className="flex gap-1 px-1 pt-1">
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => void onFile(e)}
      />
      <button type="button" onClick={() => void exportAll()} className={btn}>
        {t('exportChats', 'Export chats')}
      </button>
      <button type="button" onClick={() => fileRef.current?.click()} className={btn}>
        {t('importChats', 'Import chats')}
      </button>
    </div>
  )
}
