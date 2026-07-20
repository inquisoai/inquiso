# Current AI SDK Integration Map

The implemented (not intended) runtime path, traced 2026-07-12 at commit `18777c2`, re-verified 2026-07-13 at `98cfba4` (one unified prompt/tool loop for every provider since `1d61021`; UI transport now `ui/lib/`) with real
file/function names. Critical architectural fact: **there is no server**. The agent loop runs
in the MV3 background service worker; tools execute in that same process with direct
`chrome.*` access; the React side panel is a thin streaming client over a `runtime.Port`.

## Request lifecycle: "Download the newest invoice from this page."

```mermaid
sequenceDiagram
  participant U as User
  participant C as Composer.tsx (side panel)
  participant S as use-session.ts (port client)
  participant P as chat/port.ts (SW)
  participant R as chat/run-chat.ts
  participant M as memory/retrieval/prepare.ts
  participant A as loop/run-agent.ts → loop/agent.ts (ToolLoopAgent)
  participant Q as Qwen via createOpenAICompatible (defs/qwen.ts)
  participant G as tools/registry.ts gatedExecute
  participant PE as policy/engine.ts decidePolicy
  participant X as content/actions (via context/tab.ts sendToTab)
  participant V as agent/verify/run.ts
  participant L as memory/ledger/run-ledger.ts

  U->>C: types objective, Enter
  C->>S: onSend(text, scope, attachments, autonomy)
  S->>P: port.postMessage SendRequest (Zod-validated PortInbound)
  P->>P: beginTurn() persists user turn; new AbortController
  P->>R: runSend(convo.id, …, emit, confirm, autonomy)
  R->>L: createRunLedger(taskId=convoId, runId) + TaskCreated + checkpoint
  R->>M: prepareMemory(text, pages, ledger, emit)
  M-->>S: emit {type:'memory', items} → "Using memory" chip
  R->>A: runAgent(active, …, {ledger, memory, resume})
  A->>A: buildBrowserAgent() — ToolLoopAgent(callOptionsSchema=RunCallOptions,\nprepareCall injects memory as 2nd system msg, stopWhen, prepareStep=compactStep)
  A->>Q: agent.stream({messages, options})
  Q-->>A: fullStream parts (reasoning/tool-call/…)
  A-->>S: loop/relay.ts maps each part → PortOutbound → reducer.ts renders
  Q->>G: tool call e.g. click{handle} (SDK validates inputSchema)
  G->>PE: decidePolicy(tool, origin) — deny wins / ALWAYS_ASK / defer
  G-->>S: (if ask) emit {type:'confirm'} — ConfirmPrompt.tsx; resolver in port.ts pending map
  G->>V: runLogged(def,args,ctx)
  V->>X: before-snapshot → executeScript+tabs.sendMessage (ContentMsg 'act')
  X-->>V: {ok} → after-snapshot → classify() → verdict
  V->>L: ActionStarted/Succeeded/OutcomeVerified(+evidence) + stepCheckpoint
  V-->>Q: tool result {ok, verification} (feeds next step)
  Q-->>S: final text streams (chunk parts)
  A-->>P: done → record.ts result → completeTurn persists turn
  R->>L: finalize('completed') → RunMeta metrics; finishCheckpoint
  R->>R: void learnFromRun(runId) → episode/reflections/extract → gate → stores
  Note over M: next request repeats with retrieveBundle() hitting the new memories
```

## Where the AI SDK is used today (verified call sites)

| Concern | AI SDK API | Call site |
| --- | --- | --- |
| Reasoning loop | `ToolLoopAgent` (`stream`, `callOptionsSchema`, `prepareCall`, `prepareStep`, `stopWhen`, repair) | `loop/agent.ts`, `loop/run-agent.ts` |
| Tools | `tool()` wrapping every `defineTool` | `tools/registry.ts` `toAiTool` |
| Stop conditions | `stepCountIs` + custom `StopCondition`s | `loop/budget.ts`, `loop/stops.ts` |
| Structured output | `Output.object` | `loop/repair.ts`, `memory/pipeline/extract.ts` |
| Providers | `createOpenAI/Anthropic/Google/OpenAICompatible` | `providers/defs/*` (Qwen = openai-compatible) |
| Embeddings | `embedMany` | `embeddings/cloud.ts` (memory retrieval + page rerank) |
| MCP | `@ai-sdk/mcp` `createMCPClient` | `agent/mcp/tools.ts` |
| Subagents | agents-as-tools via `generateText` + `stepCountIs(6)` | `agent/subagents/registry.ts` |
| Voice | `TranscriptionModel`/`SpeechModel` factories | `core/providers/voice/*` |
| Errors | `APICallError`/`RetryError`/`NoSuchToolError`/`InvalidToolInputError` guards | `agent/errors.ts` |
| Smoothing | `smoothStream` | `loop/run-agent.ts` |

## Where the AI SDK is *not* used (custom layers)

| Layer | Files | Why (summary — full table in reinvention-audit.md) |
| --- | --- | --- |
| UI streaming protocol | `chat/protocol.ts`, `chat/port.ts`, `loop/relay.ts`, `chat/record.ts`, `ui/features/session/*` | predates; extension Port (no HTTP); duplicates the UIMessage-stream layer → main migration candidate |
| Confirmation round-trip | `port.ts` pending map + `ConfirmPrompt.tsx` | in-execution pause (SDK approvals are two-pass; would regress UX) |
| Policy/risk gating | `policy/*`, `tools/registry.ts` | safety-critical, deterministic, below the loop by design |
| Verification/ledger/checkpoints/memory/skills | `agent/verify/*`, `core/memory/*` | domain systems; SDK has no primitives for these |
| Page-chunk reranking | `embeddings/rerank.ts` (cosine over `embedMany`) | SDK `rerank()` requires a reranking *model*; no provider-free path — cosine ordering is deliberate |
```
