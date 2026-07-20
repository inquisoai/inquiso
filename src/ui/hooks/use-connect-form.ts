import { useState } from 'react'

/**
 * State for the settings connect/add forms: field values, a curried setter,
 * and a submit that shows `failMessage` when the connect callback returns
 * false or throws, clearing the form only on success. One home for the flow
 * GistForm/WebdavForm/McpServers/AddProviderForm each hand-rolled.
 */
export function useConnectForm<T extends Record<string, string>>(
  initial: T,
  connect: (v: T) => Promise<boolean>,
  failMessage: string,
) {
  const [v, setV] = useState(initial)
  const [error, setError] = useState('')
  const set = (k: keyof T) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }))
  const submit = async (): Promise<boolean> => {
    setError('')
    try {
      if (await connect(v)) {
        setV(initial)
        return true
      }
    } catch {
      // fall through to the shared failure message
    }
    setError(failMessage)
    return false
  }
  return { v, set, error, submit }
}
