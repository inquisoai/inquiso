import { type ModelMessage, smoothStream } from 'ai'
import { buildContext } from '@/core/context/envelope'
import { activeTabId } from '@/core/context/tab'
import type { ActiveModel } from '@/core/providers/resolve'
import type { Attachment } from '@/shared/attachment'
import { MAX_CONTEXT_CHARS } from '@/shared/constants'
import type { PageContext } from '@/shared/page'
import { type Autonomy, DEFAULT_AUTONOMY } from '../autonomy'
import { buildRunTools } from '../tools/run-tools'
import type { AgentEmit, Confirm, RunOptions } from '../types'
import { buildBrowserAgent } from './agent'
import { createMeter, stepMeter } from './budget'
import { RunCallOptions } from './call-options'
import { userMessage } from './message'
import { type Part, relay } from './relay'

/**
 * One run of the browser agent for every provider. The AI SDK ToolLoopAgent
 * drives reasoning and tool selection; typed call options carry the retrieved
 * memory and resume context (validated by the SDK, injected as a stable
 * second system message in prepareCall); everything privileged — policy gate,
 * confirmation, execution, verification, ledger — runs deterministically
 * inside the tools, below the loop. Streams every part to the UI; aborts on
 * signal.
 */
export async function runAgent(
  active: ActiveModel,
  text: string,
  pages: PageContext[],
  attachments: Attachment[],
  history: ModelMessage[],
  signal: AbortSignal,
  emit: AgentEmit,
  confirm: Confirm,
  autonomy: Autonomy = DEFAULT_AUTONOMY,
  opts: RunOptions = {},
): Promise<void> {
  const context = buildContext(pages, MAX_CONTEXT_CHARS)
  const prompt = [context, text.trim()].filter(Boolean).join('\n\n')
  const messages: ModelMessage[] = [...history, userMessage(prompt, attachments)]
  const meter = createMeter(Date.now())
  const ctx = {
    tabId: await activeTabId(),
    confirm,
    model: active.model,
    autonomy,
    vision: active.vision,
    ...(opts.ledger ? { ledger: opts.ledger } : {}),
  }
  const runTools = await buildRunTools(ctx, active.nativeTools)
  const agent = buildBrowserAgent(active, runTools.tools, meter)

  const result = await agent.stream({
    messages,
    options: RunCallOptions.parse({
      taskId: opts.ledger?.taskId ?? 'task_adhoc',
      runId: opts.ledger?.runId ?? 'run_adhoc',
      ...(opts.memory ? { memory: opts.memory } : {}),
      ...(opts.resume ? { resume: opts.resume, executionMode: 'recovery' } : {}),
    }),
    abortSignal: signal,
    onStepFinish: stepMeter(meter, emit),
    // Word-chunked delivery so streamed text reads smoothly instead of in
    // jagged provider-sized bursts.
    experimental_transform: smoothStream({ delayInMs: 15 }),
  })

  // Dual-protocol seam: result streams tee from one base, so the UIMessage
  // view runs alongside the canonical PortOutbound relay at no extra cost.
  const ui = opts.uiStream
  const uiDone = ui
    ? (async () => {
        for await (const chunk of result.toUIMessageStream()) ui(chunk)
      })().catch(() => {})
    : undefined

  try {
    for await (const part of result.fullStream as AsyncIterable<Part>) {
      if (signal.aborted) return
      relay(part, emit)
    }
  } finally {
    await uiDone
    await runTools?.close()
  }
  emit({ type: 'done' })
}
