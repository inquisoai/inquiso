# AI SDK Migration Plan

File-specific, dependency-ordered, no big-bang. Every stage keeps `pnpm check && typecheck &&
lines && test && evaluate:memory && build` green and has a rollback point (its own commit).
Effort: S/M/L. **Required-for-demo** vs **post-demo** is marked.

## Phase 0 — Version & compatibility (S) — DONE
Nothing to fix: single-version tree, no deprecated usage (installed-version-audit.md).
Rollback: n/a.

## Phase 1 — Observability, correlation, loop tests (S–M) — DONE (item 3 deferred)
1. **DONE.** `toolCallId` threaded into ledger events: `gatedExecute` receives the SDK
   `ToolCallOptions.toolCallId` and stamps it on `PermissionRequested/Granted/Denied`,
   `ActionStarted`, and `OutcomeVerified` payloads. Acceptance test:
   `tests/unit/core/agent/gate-ledger.test.ts` (one call's id on every event of its chain).
2. **DONE.** `ai/test` mock-model loop tests: `tests/unit/core/agent/loop/agent.test.ts`
   (memory via call options, invalid options rejected, stop conditions through the loop),
   `complete-stop.test.ts`, `phases.test.ts`, `repair.test.ts` (repair success / unknown
   tool / model failure).
3. Dev-only `@ai-sdk/devtools` + `experimental_telemetry`: deferred post-demo (the DEV
   `wrapLanguageModel` latency/usage middleware from Phase 7 covers the near-term need). (S)

## Phase 2 — UIMessage stream production (M) — DONE (seam landed)
`RunOptions.uiStream` is the dual-protocol seam: when set, `run-agent.ts` consumes
`result.toUIMessageStream()` concurrently with the canonical relay (verified: result streams
tee from one base — `teeStream()` in the installed dist). Acceptance met:
`tests/unit/core/agent/loop/ui-stream.test.ts` proves text/tool-call/tool-result parity
between `readUIMessageStream` reconstruction and the PortOutbound relay on a golden mock run.
Production behavior unchanged (`uiStream` unset). `chat/port.ts` forwarding has since landed
with Phase 3's transport (`port.ts` sets `uiStream` when `SendRequest.ui`, via
`session-io.ts`'s `uiSink`).

## Phase 3 — `@ai-sdk/react` + custom Port `ChatTransport` (M–L) — DONE (flagged preview)
Landed: `@ai-sdk/react@4.0.23`; `src/ui/lib/port-transport.ts` (`PortChatTransport`, tested with
a fake port: SendRequest with `ui:true`, conversation-id tracking via `data-meta` chunk,
chunk streaming until finish, error→error-chunk, out-of-band confirm routing, abort);
`SendRequest.ui` opt-in + `'ui'` PortOutbound variant + `chat/session-io.ts`; experimental
`ChatV2` panel behind `localStorage.inquisoChatV2 = '1'` (useChat messages/status/stop +
out-of-band ConfirmPrompt). Parity update (this plan's §4 preconditions): history load via the `toUIMessages` boundary
adapter (`src/ui/lib/ui-messages.ts`, tested), scope/autonomy pickers, live memory chips +
status (out-of-band), reasoning/tool/data-memory part rendering, and skill discovery
(`listBrowserSkills`, from the Agent-Skills cookbook's discovery phase). Remaining before
the §4 deletion: attachments in ChatV2 and a full live demo cycle on the flag.
Rollback: flag off — default panel untouched.

## Phase 4 — Retire duplicated UI protocol (M) — post-demo
Delete `relay.ts`, `record.ts`, `session/reducer.ts` + `finish.ts` after the useChat panel
holds for a full demo cycle; keep the history store with a UIMessage boundary adapter.
(Landed early as read-side `src/ui/lib/ui-messages.ts` — `fromUIMessages` deliberately absent
while the background recorder stays canonical; see its docblock.) Acceptance: all existing
tests migrated/green; transcript parity screenshots.

## Phase 5 — Approvals & policy (S) — decided, documentation only
SDK `needsApproval` stays **unadopted** (two-pass regression — capability-matrix.md). Policy
engine remains authoritative; per-call confirms already re-ask when parameters change (every
ask-tier call confirms; standing grants exist only for reversible capabilities and never for
ALWAYS_ASK). Action: none beyond keeping `poisoning`/`policy` tests green.

## Phase 6 — Loop-control depth (M) — DONE
Landed: evidence-citing `completeTask` tool (logs `GoalVerified`) + `hasToolCall` stop —
completion is a deterministic tool call, not trailing text; `loop/phases.ts` `guardedStep`
forces observation-only tools for the step after an all-uncertain step (both tested).
Deliberately NOT added: a fatal-context stop condition — a failed access/tab error must reach
the model so it can tell the user what to do (the loop then ends naturally on the text-only
step); full observe/plan/execute phase states judged not worth their rigidity for a browsing
agent (re-observation guard covers the real failure mode). Hard `stepCountIs` retained.

## Phase 7 — Structured outputs & middleware (S–M) — DONE (applicable scope)
Dev-only `wrapLanguageModel` latency/usage middleware landed (`providers/dev-log.ts`,
DEV-gated, prompt/response bodies never logged, v2-spec models passed through). Structured
outputs already ran through `Output.object`; model-assisted skill repair doesn't exist yet, so
there is nothing further to migrate until it does. §1.3 note: `@ai-sdk/devtools` needs its own
local viewer process — reasonable for contributor setups, not added as a dependency; the
middleware + ledger cover dev observability.

## Phase 8 — Skills progressive-disclosure authoring layer (M) — DONE
Landed: `core/memory/skills/agent-skill.ts` (`skillToAgentSkill` — frontmatter, reliability,
steps, repair diff vs the previous version via `repairDiff`, explicit not-written-back
notice) + per-skill "Export .md" in the Memory Center Workflows view. Tested.

## Phase 9 — Persistence & stream recovery (S) — post-demo
Chat-stream resumption evaluated: **not suitable** as-is (no server to hold resumable
streams; MV3 SW may die mid-stream — task resumption via checkpoints already covers the
durable half). Action: document only; revisit if a relay backend ever exists (it must not,
per hard rule).

## Phase 10 — Cleanup (S)
Remove any dual-protocol seams, dead flags, and the migration notes.

## Breaking-API watchlist
v7 renames (`system`→`instructions` in `generateText` call sites: `subagents/registry.ts`,
`pipeline/extract.ts`; `stepCountIs`→`isStepCount`) — do not adopt v7 mid-plan.
