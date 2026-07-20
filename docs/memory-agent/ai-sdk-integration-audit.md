# AI SDK Integration Audit

Audited 2026-07-12 against the **installed** package (`node_modules/ai`), not remembered or
online APIs. Where this document names an API, it was verified in `node_modules/ai/dist/index.d.ts`,
`node_modules/ai/src/agent/*`, or the bundled `node_modules/ai/docs/`.

## Installed versions

| Package | Version | Notes |
| --- | --- | --- |
| `ai` | **6.0.219** | ships `docs/` and `src/` in the package — used as source of truth |
| `@ai-sdk/openai` | 3.0.80 | provider |
| `@ai-sdk/anthropic` | 3.0.93 | provider |
| `@ai-sdk/google` | 3.0.88 | provider |
| `@ai-sdk/openai-compatible` | 2.0.57 | powers Qwen/DashScope, gateways, custom endpoints |
| `@ai-sdk/mcp` | 2.0.8 | MCP tools |
| `@ai-sdk/devtools` | **not installed** | separate package; opt-in dev dependency if adopted |

The official coding skill is installed via `npx skills add vercel/ai` → `.agents/skills/ai-sdk/`
(plus a v6→v7 migration skill). Both are deliberately **untracked** (`.gitignore`: `.agents/`,
`skills-lock.json`) — generated third-party agent config, reinstallable with one command.

## Feature availability in ai@6.0.219 (verified)

| Capability | Available | Evidence (installed package) |
| --- | --- | --- |
| `ToolLoopAgent` | **Yes** | `declare class ToolLoopAgent<CALL_OPTIONS, TOOLS, OUTPUT>` with `.generate()`/`.stream()`; `src/agent/tool-loop-agent.ts` |
| Typed call options + `prepareCall` | **Yes** | `ToolLoopAgentSettings.callOptionsSchema?: FlexibleSchema<CALL_OPTIONS>`, `prepareCall?: (options) => …` (`src/agent/tool-loop-agent-settings.ts`) |
| `prepareStep` | **Yes** | settings `prepareStep?: PrepareStepFunction` (same function type `streamText` uses — our `compactStep` is drop-in) |
| Custom stop conditions | **Yes** | `stopWhen?: StopCondition \| StopCondition[]` (default `stepCountIs(20)`); `StopCondition = ({steps}) => boolean`; helpers `stepCountIs`, `hasToolCall`, `isLoopFinished` |
| Tool approvals | **Yes, with a caveat** | `Tool.needsApproval` (bool or async predicate over input). Per bundled docs (`03-ai-sdk-core/15-tools-and-tool-calling.mdx` §"How It Works"): the loop **does not pause** — generation *ends* with `tool-approval-request` parts, the app appends a `tool-approval-response` message, and a **second model call** resumes |
| Structured outputs | **Yes** | `Output.object/array/choice/json/text`; agent-level `output` setting; already used (`repair.ts`, `extract.ts`) |
| Tool-call repair | **Yes** | `experimental_repairToolCall` (already used) |
| Streaming | **Yes** | `agent.stream()` returns the same `StreamTextResult` (`fullStream`) our relay consumes |
| Instructions w/ provider options | **Yes** | `instructions?: string \| SystemModelMessage \| SystemModelMessage[]` — supports the Anthropic cache-control system message natively; `allowSystemInMessages` defaults false |
| Telemetry | **Yes (experimental)** | `experimental_telemetry?: TelemetrySettings` (OTel-based) |
| Lifecycle callbacks | **Yes** | `onStepFinish`, `onFinish` at settings and call level |
| Embeddings / reranking | **Yes** | `embedMany` (used), `rerank` module present (we use our own cosine ordering) |
| Agent Skills (SKILL.md) | **Docs/cookbook pattern only** | referenced from `02-getting-started/09-coding-agents.mdx`; **no runtime `AgentSkill` export** in this version — progressive disclosure is an app-level pattern |
| Subagents | **Pattern, not primitive** | `03-agents/06-subagents.mdx` — agents-as-tools composition (we already do this with `ask_*` subagents) |
| DevTools | Package exists, not installed | would be a dev-only dependency + local UI |

## Current Inquiso usage of the SDK (pre-integration)

- **Loop**: hand-assembled `streamText({ tools, stopWhen, prepareStep, experimental_repairToolCall, maxParallelCalls, onStepFinish, experimental_transform })` in `loop/run-agent.ts` — i.e. exactly the pieces `ToolLoopAgent` packages.
- **Tools**: custom `defineTool` registry (`tools/context.ts`, `tools/registry.ts`) wrapped into SDK `tool()` by `toAiTool`; the confirm/policy gate and ledger/verifier run **inside** `execute` (below the model loop).
- **Messages/stream**: port protocol + `relay()` over `fullStream`; Anthropic caching via a hand-built system `ModelMessage` (`loop/cache.ts`).
- **Providers**: registry of `ProviderDef`s over `@ai-sdk/*` factories; Qwen = `createOpenAICompatible` (chat + `.textEmbeddingModel('text-embedding-v4')`). **Fully compatible with `ToolLoopAgent`** — the agent takes any `LanguageModel`, and tool calling over DashScope's OpenAI-compatible API is already exercised.
- **Structured output**: `Output.object` in tool repair and memory extraction.
- **Testing**: deterministic scripted planner + real subsystem (eval harness); no SDK mock-model tests yet.

## Decision

```text
Decision A: Adopt ToolLoopAgent as the primary reasoning loop.
```

**Evidence.** (1) The installed version has the full feature set (table above), and
`agent.stream()` returns the identical `StreamTextResult` our port relay already consumes — the
UI contract doesn't change. (2) Our loop assembly is a hand-rolled subset of
`ToolLoopAgentSettings`; migrating deletes bespoke glue rather than adding abstraction.
(3) `callOptionsSchema`/`prepareCall` replaces the untyped `RunOptions` threading with a typed,
runtime-validated per-run context — strictly better. (4) Instructions-level
`SystemModelMessage` support subsumes our manual cached-system-message plumbing. (5) Risk is
contained because everything below the loop (gate → executor → verifier → ledger) is untouched:
the model still only *proposes*; `gatedExecute` remains the sole execution path.

**What deliberately stays custom (and why the SDK primitive was insufficient):**

| Custom system | Why not the SDK primitive |
| --- | --- |
| Confirm gate inside `gatedExecute` (port round-trip resolver) | SDK `needsApproval` **ends the generation** and requires a second model call with an appended approval-response message (verified in bundled docs). Our gate pauses *inside* tool execution: one model pass, no re-send, works with our long-lived port and MV3 worker. Safety-critical UX; adopting `needsApproval` would regress it. Revisit only if we move the UI to `useChat`. |
| `defineTool` registry (risk, capability, `confirmWhen` floors, availability) | SDK `tool()` has no risk/capability metadata or deterministic policy hooks; the registry *wraps* SDK `tool()` — it does not replace it. |
| Event ledger / checkpoints / verifier / memory pipeline / policy engine / skill state machine | Browser- and memory-domain-specific, safety-critical, deterministic by requirement; the SDK explicitly leaves durable state to the app (its `docs/03-agents/06-memory.mdx` is a pattern guide, not a store). SDK telemetry remains model-loop diagnostics; the ledger remains the canonical domain record (correlated by `taskId`/`runId`). |
| `BrowserSkill` (typed, versioned, evidence-backed) | No runtime Agent-Skills primitive exists in this version; SKILL.md is an instructional-content pattern. BrowserSkill stays the source of truth; progressive disclosure is implemented app-side (metadata in the bundle, full steps via a `loadBrowserSkill` tool). |
| Budget meter (wall-clock/token caps) | Expressed *as* SDK `StopCondition`s — custom conditions, standard mechanism. |

**Migration risks & mitigations:** prompt-shape change (memory/resume move from user-prompt
prefix to a per-run system message — cache-friendlier, but wording-sensitive; covered by unit
tests on the instruction builder); `allowSystemInMessages: false` requires the cached system
message to move into `instructions` (done); `maxParallelCalls` must be re-verified as a
supported setting on the agent (it is part of `CallSettings`); non-tool-calling providers keep
working because `tools` is optional.

> Resolution (2026-07-12): `maxParallelCalls` turned out to be an `embedMany` option, not an
> agent setting — it had been silently ignored and was removed. The tools-optional branch is
> also gone: every shipped provider tool-calls (on-device ones via their providers' JSON
> polyfill), so one prompt and one loop serve all (`1d61021`).

**Exact files affected:** `src/core/agent/loop/run-agent.ts` (rewrite around the agent),
new `loop/agent.ts`, `loop/call-options.ts`, `loop/stops.ts`; `loop/cache.ts` (system message
becomes `instructions`); `core/chat/run-chat.ts` (pass typed call options);
`memory/retrieval/inject.ts` (skill metadata-only, progressive disclosure);
new `tools/read/load-skill.ts`, `tools/read/memory-feedback.ts`; tests under
`tests/unit/core/agent/loop/` and `tests/unit/core/memory/`.

## Deferred (documented, not implemented now)

- **Phase-based `activeTools` in `prepareStep`** (observe/plan/execute/verify/recover/complete)
  — mechanism verified available; needs a phase model worth its complexity. Current
  restriction: capability policy + per-origin grants.
- **SDK approvals bridge** — see confirm-gate rationale above.
- **`@ai-sdk/devtools`** — add as opt-in dev dependency when debugging model loops locally;
  never in production builds.
- **`experimental_telemetry`** — wire to OTel only if a collector is introduced; correlation
  ids (`taskId`/`runId`) already flow through the ledger.
- **Subagent restructure** — existing `ask_*` subagents already follow the SDK's
  agents-as-tools pattern; extraction/repair stay bounded `generateText` workflow stages by
  design (deterministic surroundings).
