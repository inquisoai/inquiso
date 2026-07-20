import { useCallback, useRef, useState } from 'react'

/**
 * Records microphone audio via MediaRecorder and hands the clip back as base64
 * on stop. Kept UI-side (getUserMedia needs a user gesture and a document);
 * transcription itself runs in the background with the user's key.
 */
export function useRecorder(onClip: (base64: string) => void) {
  const [recording, setRecording] = useState(false)
  const rec = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    chunks.current = []
    mr.ondataavailable = (e) => {
      if (e.data.size) chunks.current.push(e.data)
    }
    mr.onstop = () => {
      for (const track of stream.getTracks()) track.stop()
      setRecording(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        const url = String(reader.result)
        onClip(url.slice(url.indexOf(',') + 1))
      }
      reader.readAsDataURL(new Blob(chunks.current, { type: mr.mimeType }))
    }
    rec.current = mr
    mr.start()
    setRecording(true)
  }, [onClip])

  const toggle = useCallback(() => {
    if (recording) rec.current?.stop()
    else void start()
  }, [recording, start])

  return { recording, toggle }
}
