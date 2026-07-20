# AI SDK Capability Matrix

Against installed `ai@6.0.219` (+ providers) and `@ai-sdk/react@4.0.23`; `@ai-sdk/devtools`
is not installed (documented decision). "Correctly used" is only Yes with source + test + traced runtime path.

## Agent architecture

| Capability | Available | Used now | Correctly used | Inquiso use case | Action |
| --- | ---: | ---: | ---: | --- | --- |
| `ToolLoopAgent` | Yes | Yes | Yes (unit-tested; live Qwen re-verification pending next demo run) | browser reasoning loop | Keep |
| `stopWhen` custom conditions | Yes | Yes | Yes (`budget.ts`, `stops.ts` + tests) | budgets, stuck-loop, uncertainty streaks | Keep; add completion/cancel conditions (plan §6) |
| `prepareStep` | Yes | Yes | Yes (`compactStep`, KEEP=2) | context compaction | Keep; phase-based `activeTools` later |
| `callOptionsSchema` / `prepareCall` | Yes | Yes | Yes (`RunCallOptions`, SDK-validated) | typed per-run memory/resume/mode | Keep; add origin/policy summaries later |
| Tool approvals (`needsApproval`) | Yes | No | — | sensitive-action pause | **Do not adopt**: two-pass protocol (generation ends, approval message appended, second model call — bundled docs §"How It Works") regresses our in-execution single-pass confirm; revisit only with a useChat UI |
| Subagents (agents-as-tools) | Pattern | Yes | Yes | researcher/trust-auditor/comparer | Keep |
| Agent memory (docs pattern) | Pattern only | n/a | — | — | Inquiso memory domain is richer; keep custom |
| Workflow patterns | Pattern | Yes | Yes | learn/consolidate/skill lifecycle are deterministic functions around bounded `generateText` | Keep |

## Core

| Capability | Available | Used now | Correctly used | Inquiso use case | Action |
| --- | ---: | ---: | ---: | --- | --- |
| `tool()` + Zod input schemas | Yes | Yes | Yes (every tool via `toAiTool`) | all 30+ tools | Keep |
| Client-forwarded tools (no `execute`) | Yes (core types) | No | — | n/a — **no server**; loop and executor share the SW process | Not applicable (see react-tool-flow.md) |
| Dynamic tools | Yes | Yes | Yes (MCP tools) | MCP | Keep |
| Structured output (`Output.*`) | Yes | Yes | Yes (repair, extraction; Zod re-parse + bounded retry/discard) | model-produced data | Extend to episode/skill-repair outputs when those become model-assisted |
| Embeddings (`embedMany`) | Yes | Yes | Yes (`embeddings/cloud.ts` + cache) | memory + page retrieval | Keep |
| Reranking (`rerank()`) | Yes | No | — | needs a reranking model; no BYOK rerank provider configured | Not applicable now; Inquiso keeps scope/temporal/budget policy regardless |
| Middleware (`wrapLanguageModel`) | Yes | **Yes** (dev-only latency/usage logging, `providers/dev-log.ts`) | Yes | dev diagnostics | Landed; redaction/fallbacks remain optional |
| Error classes | Yes | Yes | Yes (`friendlyError`) | honest surfaced errors | Keep |
| Testing utilities (`ai/test` mocks) | Yes | **Yes** (`MockLanguageModelV3` loop + parity + completion tests) | Yes | loop tests without providers | Landed |
| Telemetry (`experimental_telemetry`) | Yes | No | — | OTel spans | Later; ledger stays canonical |
| Lifecycle callbacks (`onStepFinish`, `onToolCallStart/Finish`) | Yes | Partial (`onStepFinish` metering) | Yes | budget + live metrics | Optionally add toolCall callbacks for correlation ids |
| MCP | Yes | Yes | Yes (gated high-risk) | user MCP servers | Keep |
| Provider management (registry/gateway) | Yes | Custom registry | Yes | BYOK multi-provider | Keep custom (UI-driven, encrypted keys, host grants — SDK registry has no such concerns) |

## UI (`@ai-sdk/react@4.0.23`)

| Capability | Available | Used now | Correctly used | Inquiso use case | Action |
| --- | ---: | ---: | ---: | --- | --- |
| `useChat` / `Chat` | **Installed** (@ai-sdk/react 4.0.23) | Yes (flagged ChatV2) | Yes (transport-tested; live run pending) | side-panel state | Flagged preview at parity minus attachments; §4 deletion gated on live cycle |
| `DefaultChatTransport` | Yes (installed) | No | — | n/a — no HTTP endpoint exists (serverless hard rule) | Not applicable |
| Custom `ChatTransport` | Types in core `ai` | **Yes** (`PortChatTransport`, tested) | Yes | bridge `runtime.Port` → UIMessage stream | Landed |
| `createAgentUIStream` / `readUIMessageStream` | Yes (core `ai`) | **Yes** (`toUIMessageStream` seam + parity test) | Yes | SW-side UIMessage production | Landed (plan §2) |
| `onToolCall` / `addToolOutput` / `sendAutomaticallyWhen` / `lastAssistantMessageIsCompleteWithToolCalls` | Yes (installed: useChat option + `AbstractChat.addToolOutput`; `lastAssistantMessageIsCompleteWithToolCalls` in core `ai`) | No | — | client-executed tools | **Not recommended**: would move execution authority into a closable panel and bypassable surface (docs/05 T6); tools stay SW-side |
| `addToolApprovalResponse` | Yes (installed, `AbstractChat.addToolApprovalResponse`) | No | — | approval UI | Only if approvals move to SDK two-pass (not planned) |
| Data parts (persistent/transient, `onData`) | Yes (protocol in core) | Partial (`data-meta` chunk; `data-memory` parts on history load) | Yes | progress, memory chips, metrics | Live memory/status still out-of-band by design (pre-`start` chunks); revisit at §4 |
| Message metadata | Yes | Partial (usage/thinkMs via `toUIMessages` on load) | Yes | usage per message | Streaming-side metadata lands with §4 |
| Message persistence / resume streams | Pattern + helpers | Custom (`history/*`, port re-send) | Yes for our model | chat persistence | Keep custom store; map to UIMessages at the boundary. Task resumption stays checkpoint-based (distinct concept) |
| Generative UI | Yes (installed) | No | — | — | Not applicable now |

## Cookbook relevance

| Guide | Status for Inquiso |
| --- | --- |
| Build a Custom Memory Tool | Already implemented, stricter than the guide (deterministic gate; no transcript-as-memory). One idea recorded for later: mid-run memory refresh on origin change (guide reloads core memory per call via prepareCall) |
| Compact Agent Context | Already implemented (`compactStep` via `prepareStep`) |
| Add Skills to Your Agent | Implemented: discovery (`listBrowserSkills`) + activation (`loadBrowserSkill`) + SKILL.md export (`skillToAgentSkill`) |
| RAG Agent | Not applicable as-is; memory retrieval is the domain equivalent |
| Multi-Modal Agent | Applicable later (qwen-vl path exists, unexercised) |
| Computer Use | Not applicable (Anthropic-specific computer-use tools; Inquiso has its own executor) |
| Client-side tool execution | Not applicable (no server; see react-tool-flow.md) |
```
