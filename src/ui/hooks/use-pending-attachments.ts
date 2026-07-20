import { type ChangeEvent, type ClipboardEvent, useState } from 'react'
import { type Attachment, MAX_FILE_BYTES, MAX_FILES } from '@/shared/attachment'

const readFile = (file: File): Promise<Attachment> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        mediaType: file.type || 'application/octet-stream',
        dataUrl: String(reader.result),
      })
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

/** Holds the pending attachments for the next message (the composer's draft —
 * distinct from use-attachment-urls, which resolves stored refs for display).
 * Enforces the count and per-file size caps; excess files are dropped silently.
 * `canAttach` gates the paste handler so files land only on a vision model. */
export function usePendingAttachments(canAttach = true) {
  const [files, setFiles] = useState<Attachment[]>([])

  const add = async (list: FileList | File[]): Promise<void> => {
    const room = MAX_FILES - files.length
    const picked = Array.from(list)
      .filter((f) => f.size <= MAX_FILE_BYTES)
      .slice(0, Math.max(0, room))
    const read = await Promise.all(picked.map(readFile))
    setFiles((cur) => [...cur, ...read].slice(0, MAX_FILES))
  }

  /** File-picker change: add the chosen files, then reset so the same file can
   * be picked again. */
  const onFile = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) void add(e.target.files)
    e.target.value = ''
  }

  /** Paste of a file/image (e.g. a screenshot) into the composer — attach it
   * instead of pasting nothing, keeping the text paste for plain clipboards. */
  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>): void => {
    if (!canAttach) return
    const pasted = Array.from(e.clipboardData.files)
    if (pasted.length) {
      e.preventDefault()
      void add(pasted)
    }
  }

  const remove = (name: string): void => setFiles((cur) => cur.filter((f) => f.name !== name))
  const clear = (): void => setFiles([])

  return { files, add, remove, clear, onFile, onPaste }
}
