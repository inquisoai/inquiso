import type { ModelMessage } from 'ai'
import { runAgent } from '@/core/agent/loop/run-agent'
import type { Confirm } from '@/core/agent/types'
import { getScopedContext } from '@/core/context/multi-page'
import {
  finishCheckpoint,
  interruptedCheckpoint,
  resumeNote,
  startCheckpoint,
} from '@/core/memory/checkpoint/service'
import { learnFromRun } from '@/core/memory/learn'
import { createRunLedger } from '@/core/memory/ledger/run-ledger'
import { prepareMemory } from '@/core/memory/retrieval/prepare'
import { orderPages } from '@/core/providers/embeddings/rerank'
import { activeAvailability, resolveActiveModel } from '@/core/providers/resolve'
import type { Attachment } from '@/shared/attachment'
import type { Autonomy } from '@/shared/autonomy'
import type { Scope } from '@/shared/constants'
import { toPageRef } from '@/shared/memory/events'
import { newId } from '@/shared/memory/ids'
import type { PortOutbound } from './protocol'
import { readingStatus, unavailableMessage } from './status'

type Emit = (msg: PortOutbound) => void

/**
 * One unified turn (see git history for the pre-memory version): the scoped
 * page(s) ground the run when available, the run is recorded to the event
 * ledger, checkpointed for resume, and finalized with a task outcome. The
 * task is the conversation; each send is one run of it.
 */
export async function runSend(
  taskId: string,
  text: string,
  scope: Scope,
  attachments: Attachment[],
  history: ModelMessage[],
  signal: AbortSignal,
  emit: Emit,
  confirm: Confirm,
  autonomy: Autonomy,
  uiStream?: (chunk: import('ai').UIMessageChunk) => void,
): Promise<void> {
  const status = await activeAvailability()
  if (status.state !== 'available') {
    emit({ type: 'error', error: unavailableMessage(status) })
    return
  }

  const runId = newId('run')
  const ledger = createRunLedger(taskId, runId, text.trim().slice(0, 500))
  const interrupted = await interruptedCheckpoint(taskId, runId)
  ledger.log(interrupted ? 'TaskResumed' : 'TaskCreated', {}, { actor: 'user' })
  await startCheckpoint(taskId, runId, text.trim().slice(0, 500))
  // Tee the stream to keep run metrics current (model calls ≈ steps).
  const teed: Emit = (msg) => {
    if (msg.type === 'budget') {
      ledger.metrics.modelCalls = msg.steps
      ledger.metrics.tokens = msg.tokens
    }
    emit(msg)
  }

  teed({ type: 'status', status: readingStatus(scope) })
  const pages = await getScopedContext(scope)
  for (const p of pages) ledger.log('PageObserved', {}, { page: toPageRef(p.url, p.title) })
  teed({ type: 'status', status: 'Thinking…' })
  const memory = await prepareMemory(text, pages, ledger, teed)
  const ordered = pages.length ? await orderPages(pages, text) : pages
  const active = await resolveActiveModel()
  try {
    await runAgent(active, text, ordered, attachments, history, signal, teed, confirm, autonomy, {
      ledger,
      ...(memory ? { memory } : {}),
      ...(interrupted ? { resume: resumeNote(interrupted) } : {}),
      ...(uiStream ? { uiStream } : {}),
    })
    if (signal.aborted) {
      await ledger.finalize('aborted')
    } else {
      // Completed: the resume point is spent. Interrupted runs keep theirs.
      await finishCheckpoint(taskId)
      await ledger.finalize('completed')
    }
  } catch (e) {
    await ledger.finalize('error')
    throw e
  } finally {
    // Post-run learning reads only the persisted ledger — idempotent, safe
    // across service-worker restarts, and never blocks the reply.
    void learnFromRun(runId)
  }
}
