# Reinvention Audit

Repository-wide sweep for custom implementations of things the installed AI SDK provides.
Recommendations: Keep / Replace / Wrap / Merge / Deprecate / Investigate.

| Custom component | Location | AI SDK equivalent | Recommendation | Reason |
| --- | --- | --- | --- | --- |
| Agent loop | `loop/agent.ts` + `run-agent.ts` | `ToolLoopAgent` | **Keep (already migrated)** | as of `18777c2` the loop *is* ToolLoopAgent; no hand-rolled `while(!complete)` remains |
| Tool registry + gate | `tools/context.ts`, `tools/registry.ts` | `tool()` | **Keep (wraps, not reinvents)** | adds risk/capability metadata, `confirmWhen` floors, availability, policy+ledger+verify hooks; SDK `tool()` has no policy surface. Every tool still *is* an SDK `tool()` |
| Tool parser / tool-call protocol | none | SDK internal | — | nothing custom; SDK parses/validates (plus `makeRepair` using SDK repair hook) |
| Chat state (reducer/session) | `ui/features/session/*` | `useChat` messages/status | **Migrate incrementally** | genuine duplication; see react-tool-flow.md — post-demo, custom Port transport |
| Stream part relay | `loop/relay.ts` | `createAgentUIStream` → UIMessage chunks | **Migrate incrementally** | same as above; relay is the custom UIMessage-protocol stand-in |
| Turn recorder | `chat/record.ts` | UIMessage persistence | **Migrate incrementally** | mirrors reducer for persistence; folds into UIMessage snapshotting |
| SSE/stream parser | none | SDK `fullStream` | — | no custom parsing anywhere; we consume `fullStream` |
| Approval state | `chat/session-io.ts` confirm-promise map (extracted from `port.ts`) + `ConfirmPrompt` | `needsApproval` + `addToolApprovalResponse` | **Keep** | SDK approvals are two-pass (generation ends, second model call); our in-execution pause is single-pass, works over the Port, and keeps the SW authoritative. Documented in capability-matrix.md |
| UI-chunk fan-out | `chat/session-io.ts` `uiSink` | server `pipeUIMessageStreamToResponse` | **Keep (browser-specific)** | the SDK's stream→client plumbing assumes an HTTP response; a Port `postMessage` sink is the MV3 equivalent, one function deep over the SDK's own `toUIMessageStream()` |
| Message persistence | `core/data/history/*` | UI persistence patterns | **Keep** | Zod-validated IndexedDB store with export/import + GC; SDK offers patterns, not a store. Boundary adapter only if useChat lands |
| Model retries | none custom | SDK `maxRetries` + `RetryError` | — | SDK defaults used; `friendlyError` maps the error classes |
| Provider abstraction | `providers/*` (`ProviderDef`, registry, resolve) | provider registry | **Keep** | BYOK key encryption, host-permission grants, availability probes, UI catalog — product concerns the SDK registry doesn't model; each def returns real SDK models |
| Structured-output parsing | `pipeline/extract.ts`, `loop/repair.ts` | `Output.object` | **Keep (already SDK)** | Zod re-parse + bounded failure handling on top |
| Embedding provider | `embeddings/cloud.ts` | `embedMany` | **Keep (already SDK)** | adds key resolution + null-fallback to lexical |
| Reranker | `embeddings/rerank.ts`, `retrieval/score.ts` | `rerank()` | **Keep, Investigate later** | SDK `rerank()` requires a reranking model; no BYOK rerank provider is configured, and final ranking is deliberately deterministic policy (trust/recency/usefulness). Revisit if a Qwen reranker model is added |
| Telemetry | ledger (domain events) | `experimental_telemetry` | **Keep + Investigate** | ledger is canonical domain history, not model diagnostics; add OTel/devtools as opt-in dev layer (plan §1) without duplicating records |
| Tool UI | `transcript/ToolLine.tsx`, `Trace.tsx` | tool parts rendering | **Migrate with useChat** | presentational |
| Progress streaming | `PortOutbound` status/memory/budget events | data parts + `onData` | **Migrate with useChat** | one-to-one mapping exists |
| Context compaction | `loop/steps.ts` (`compactStep`) | `prepareStep` | **Keep (already SDK)** | uses SDK `pruneMessages` inside SDK `prepareStep` |
| Skills loader | `retrieval/inject.ts` metadata + `loadBrowserSkill` tool | Agent Skills (cookbook pattern) | **Keep** | progressive disclosure implemented app-side against typed `BrowserSkill` (canonical); SKILL.md authoring layer is a later additive adapter, never the source of truth |
| Model mocks in tests | scripted planner (`tests/evaluation/planner.ts`) | `ai/test` mocks | **Keep + Add** | the scripted planner measures the *memory system* with constant competence (by design); add `MockLanguageModelV*` tests for the *loop* itself (plan §1) |

## Verdict

```text
Unnecessary reinvention: MODERATE
```

Concentrated in exactly one place: the side-panel streaming/state layer (relay + recorder +
reducer + protocol ≈ 500 lines) predates the audit and duplicates the UIMessage-stream/useChat
stack. Everything else custom is either a thin justified wrapper over SDK primitives or a
domain/safety system with no SDK equivalent. The migration plan retires the duplication
incrementally without a big-bang rewrite.
