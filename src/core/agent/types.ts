import type { UIMessageChunk } from 'ai'
import type { PortOutbound } from '@/core/chat/protocol'
import type { RunLedger } from '@/core/memory/ledger/run-ledger'

export type AgentEmit = (msg: PortOutbound) => void

/** Asks the user to approve a sensitive action; resolves true if approved. */
export type Confirm = (tool: string, args: unknown) => Promise<boolean>

/** Memory-system hooks for a run: the typed event ledger, a resume note when
 * an interrupted checkpoint exists, and the retrieved-memory prompt block.
 * `uiStream` is the dual-protocol seam (AI SDK migration plan §2): when set,
 * the run also emits standard UIMessage chunks (teed from the same result) so
 * a useChat consumer can replace the PortOutbound protocol incrementally. */
export interface RunOptions {
  ledger?: RunLedger
  resume?: string
  memory?: string
  uiStream?: (chunk: UIMessageChunk) => void
}
