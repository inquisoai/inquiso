# MemoryAgent Build Log

Chronological log of implementation work, discoveries, and deviations from
[implementation-plan.md](implementation-plan.md). Newest entries at the bottom.

## 2026-07-11 — Phase 0: audit

- Audited the full repo; baseline recorded in
  [current-architecture.md](current-architecture.md): typecheck ✅, 102/102 unit tests ✅,
  builds ✅, 4 pre-existing Biome complexity warnings (left untouched).
- Key discoveries vs the task spec:
  - CLAUDE.md status line ("design phase") is stale — M0–M5 are implemented; the plan extends
    a working agent instead of scaffolding one.
  - Existing memory is a flat `remember`/`recall` KV (`tools/read/memory.ts`) — will be
    replaced by the typed pipeline with a migration.
  - No outcome verification exists anywhere; `relay` even defaults missing `ok` to success.
  - The serverless hard rule redirects "Alibaba Cloud backend" → OSS-hosted demo portals +
    submission assets; Qwen integrates as a BYOK provider def (compatible-mode), which the
    provider registry supports cleanly.
- Wrote the implementation plan mapped to real files.

## 2026-07-11 — Phase 1: ledger, verifier, checkpoints, resume

- **Event ledger** (`src/core/memory/ledger/`): append-only, seq-ordered events keyed
  `runId:seq` over `appStore('ledger')`, plus a `runs` index with per-run metrics (actions,
  failures, recoveries, model calls, tokens) and origin list; capped at 100 runs, GC removes a
  run's events with it. `RunLedger.log()` is fire-and-forget but writes are chained so on-disk
  order matches emission order. Recovery counting = success after an earlier failure in-run.
- **Outcome verifier** (`src/core/agent/verify/`): before/after snapshots (tab url/title via
  `browser.tabs.get`, element state via a new `state` content message) classified by a pure
  `classify()` into `verified_success | verified_failure | uncertain`. Key rules: navigate
  needs an observed URL change; `type` compares the exact field value (mismatch = verified
  failure — catches swallowed input); no observable change is *uncertain, never success*.
  Password fields are excluded at the source (`content/actions/state.ts`), so secrets can't
  reach the ledger. The verdict is attached to the tool result so the model sees it too.
- **Checkpoints** (`src/core/memory/checkpoint/`): one per task (= conversation), advanced only
  on verified successes, removed on completion. A new run finding an `active` checkpoint from
  a different runId = interruption → `resumeNote()` is injected into the prompt demanding
  re-observation and forbidding repeats of verified side effects.
- **Wiring**: registry's confirm gate now logs Permission{Requested,Granted,Denied}; all tool
  executions ledger-logged via `runLogged`; `runSend` creates the ledger + checkpoint per run
  and finalizes with a task outcome. `ToolContext` gained optional `ledger`.
- Deviations: `RunOptions` lives in `core/agent/types.ts` (run-agent.ts was at the 100-line
  cap); evidence diffing split to `verify/delta.ts` and plain logging to `verify/exec.ts` to
  satisfy Biome's cognitive-complexity ceiling.
- Gates: typecheck ✅, Biome ✅ (baseline 4 warnings only), lines ✅, tests 121/121 ✅ (19 new),
  builds ✅.

## 2026-07-11 — Phase 2: typed memory, write pipeline, Memory Center

- **Domain model** (`src/shared/memory/{enums,record,candidate}.ts`): `MemoryRecord` with
  scope/provenance/trust/temporal/relations/metrics + status machine; `MemoryCandidate` whose
  `recommendedDecision` is advisory only; `slotKey` as the deterministic conflict key.
- **Store** (`src/core/memory/store/`): validated repo over `appStore('memories')` (2000 cap,
  usefulness-aware trim), hard scope/temporal filters applied *before* ranking, lexical
  scoring + Jaccard dedupe similarity, mutations (confirm, mark-incorrect, edit, rescope,
  forget = real delete, temporal supersession preserving the old fact with `validUntil` +
  contradiction links, retrieval bookkeeping, reinforcement).
- **Write pipeline** (`src/core/memory/pipeline/`): deterministic order — sensitive-data scan
  (keywords + secret shapes + Luhn cards; pre-model, un-overridable) → sensitivity floor →
  page-origin quarantine → explicit-user store → confidence floor → inferred preferences ask
  the user → unknown sources can never self-store. Blocked/quarantined attempts land in a
  capped, redacted `memory-blocked` store surfaced in the UI.
- **Tools**: `remember`/`recall` rebuilt on the pipeline (kind, site scoping, slotKey;
  recall = scoped, current-only, lexically ranked). Legacy KV migrates through the gate on
  background start (a stored secret would be dropped, not carried forward).
- **Memory Center** (`src/ui/features/memory/` + `memory` settings tab + `use-memory` hook in
  the centralized hooks dir): Knowledge / Tasks / Blocked views, per-memory provenance line,
  confirm/edit/mark-incorrect/forget, export + delete-all, i18n keys added.
- **Messaging**: `schemas/memory.ts` exports a `memoryMsgs` tuple spread into `RequestMsg`
  (keeps contract.ts under the line cap); handlers in `memory-handlers.ts`.
- Gates: typecheck ✅, Biome ✅ (baseline 4), lines ✅, tests 150/150 ✅ (29 new), builds ✅.

## 2026-07-11 — Phase 3: retrieval, episodes, reflections, Qwen

- **Qwen provider** (`providers/defs/qwen.ts`): DashScope intl compatible-mode; qwen3-max /
  qwen-plus / qwen-flash / qwen3-vl-plus; `fastModel: 'qwen-flash'` (new `ProviderDef` field)
  routed by `providers/extraction.ts` for background memory work; `text-embedding-v4`
  embeddings through the existing `Embedder` interface. Note: if DashScope CORS blocks direct
  browser calls on some setups, the custom-provider flow (with an origin grant) is the fallback.
- **Learning** (`memory/learn.ts` + `pipeline/{episode,reflect,extract}.ts`): after finalize,
  `learnFromRun(runId)` reads only the persisted ledger (idempotent across SW restarts):
  deterministic episode (strategy = verified steps; trivial runs skipped), deterministic
  slot-keyed failure→recovery reflections, and optional model extraction (schema-validated;
  preferences still land as ask-user via the gate). Honors `settings.memory.autoLearn` +
  per-origin disables.
- **Retrieval** (`memory/retrieval/`): hard filters → hybrid score (lexical, cached
  embeddings when available, confidence, usefulness, recency, misleading/page penalties) →
  per-kind budgets (3/5/3/3/3). Relevance gate: facts/episodes/reflections need an actual
  lexical/semantic connection — nothing rides along to fill a budget; preferences are exempt
  (few, cheap, broadly applicable). Rendered as a labeled `<memories>` block that states
  memories never authorize side effects and the live page wins conflicts.
- **Transparency**: new `memory` port event → live "Using memory: …" chip, persisted on the
  turn (`Turn.memories`), `MemoryRetrieved` ledger event, retrieval metrics bumped.
- Deviations: session reducer's `done` case extracted to `session/finish.ts` and run-chat's
  status helpers to `chat/status.ts` (line cap); reducer complexity warning fixed in passing
  (Biome warnings now 3, all pre-existing).
- Gates: typecheck ✅, Biome ✅, lines ✅, tests 160/160 ✅, builds ✅.

## 2026-07-11 — Phase 4: browser skill engine (flagship)

- **Model** (`shared/memory/{skill,locator}.ts`): versioned `BrowserSkill` with semantic-locator
  steps, typed inputs, preconditions, success criteria, reliability counters, and the state
  machine draft → shadow → verified → trusted / degraded / retired.
- **Learning trigger**: episode dedup doubles as the repeat detector — when a run's episode
  comes back 'reinforced' (same goal succeeded again) and no live skill matches, the run's
  verified trajectory is normalized into a shadow skill (`skills/candidates.ts`). One
  uncertain run never auto-promotes.
- **Normalization** (`skills/normalize.ts`): verified ledger events → semantic steps.
  `ActionStarted` now carries the element's accessible name/role (from the before-snapshot;
  password fields excluded at the source), so locators are role+name, not selectors. Typed
  values are *always* `{{parameters}}` — the ledger never stored them.
- **Shadow testing** (`skills/shadow.ts` + `lifecycle.ts`): shadow skills are advisory in the
  prompt; after a matching run completes, agreement (skill steps appear in order in the real
  verified trajectory) records a success; disagreement is logged, not punished.
- **Execution** (`skills/{execute,step}.ts` + `tools/act/run-skill.ts`): only
  verified/trusted skills execute; preconditions (origin, required inputs) fail fast; every
  step re-resolves its element via the locator ladder and routes through the shared
  `gatedExecute` (extracted from `toAiTool`) — same confirm gate, same outcome verifier, no
  extra authority. Verified failure or a missing element stops the run and hits reliability.
- **Degrade/repair**: 2 consecutive failures degrade; a later successful run on the same
  goal/origin mints version n+1 in shadow with `previousVersionId` chaining (old preserved).
  `repairDiff` renders the step changes.
- **Surfacing**: retrieval bundle now carries matched skills (goal-pattern lexical match ≥0.4,
  suggestible states); prompt block explains executable-vs-advisory; Memory Center gains a
  Workflows view (steps, reliability, repaired badge, Trust/Retire).
- Gates: typecheck ✅, Biome ✅ (3 pre-existing warnings), lines ✅, tests 173/173 ✅, builds ✅.

## 2026-07-11 — Phase 5: policy engine + poisoning defence

- **Policy engine** (`src/core/policy/`): tool → capability map (unknown → `unknown`,
  fail-safe); persistent origin-scoped user grants (`appStore('policies')`); deterministic
  precedence in `decidePolicy`: reads free → deny wins → ALWAYS_ASK (submit/upload/send/
  delete/purchase/settings/unknown) ignores standing allows → origin allow skips the prompt →
  defer to the risk gate. Wired into `gatedExecute` *above* the existing gate, so `confirmWhen`
  floors and risk × autonomy still apply — skills and memory gain no authority.
- **Grant surface**: grants are created/removed only via extension-page messaging
  (`policySet`/`policyRemove`) and shown in Access settings (`PolicyGrants`); no code path
  lets model output, page content, or memory write a grant.
- **Prompt boundary**: system prompt now states `<memories>` content informs but never
  authorizes, and page content can't modify memory or permissions.
- **Adversarial tests** (`poisoning.test.ts` + `policy/engine.test.ts`): the spec's attack
  strings (password capture, purchase auto-approval, recipient override, ignore-the-user)
  land as discarded/quarantined and never surface in retrieval; ALWAYS_ASK holds against a
  standing allow.
- Gates: typecheck ✅, Biome ✅, lines ✅, tests 186/186 ✅, builds ✅.

## 2026-07-11 — Phase 6: demo portals + evaluation harness

- **Portals** (`demo/portals/`, served by `pnpm demo`): invoice portal with account picker,
  paginated invoice table (newest marked), real PDF/CSV downloads, and the v1/v2 nav switch
  (`localStorage.portalNavVersion`) that makes learned memory stale on demand; expense portal
  with upload/category/amount/draft/confirmed-submit. Zero dependencies, fully static —
  deployable as-is to Alibaba OSS.
- **Evaluation** (`tests/evaluation/` + `pnpm evaluate:memory`): the real subsystem (ledger,
  write pipeline, learning, retrieval, skill lifecycle) runs against a deterministic simulator
  of the invoice portal with a scripted constant-competence planner; only the DOM is simulated.
  Measured (see evaluation-results.md): improvement 6→3→3 actions and 3→2→1 planning calls
  (full config), no-memory flat at 6/3; stale arc v2: 9 actions/4 failures (recovered) →
  degrade+repair → 3 actions/0 failures; injection block 5/5 (0% success); duplicates 0;
  memory context ≤ ~1KB. Results doc generated only from harness JSON — never hand-written.
- **Harness found a real bug**: `normalizeTrajectory` let a failed action borrow the *next*
  action's success verdict (unbounded verdict scan) — a failed "Settings" click leaked into a
  repaired skill. Fixed with an action-boundary-bounded `verdictFor` + regression unit test.
- Gates: typecheck ✅, Biome ✅, lines ✅, unit 187/187 ✅ + eval 13/13 ✅, builds ✅.

## 2026-07-11 — Phase 7: deployment + documentation

- **Alibaba Cloud**: `deploy/alibaba/deploy.sh` (idempotent ossutil sync of `demo/portals` to
  OSS static website hosting + health check; no secrets in-repo) and
  `docs/deployment/alibaba-cloud.md` (Qwen/DashScope setup, portal deployment, architecture
  diagram, env vars, proof points). Per the serverless hard rule, the cloud footprint is
  Qwen Cloud as the model backend + OSS for the demo sites — no Inquiso server.
- **Docs**: `docs/memory-agent/{overview,data-model,retrieval,browser-skills,security,
  evaluation,showcase}.md` with Mermaid diagrams (architecture, memory lifecycle, skill state
  machine, trust boundaries, first-vs-repeated sequence), `docs/demo-script.md` (3-minute
  walkthrough), README MemoryAgent section + doc table, CLAUDE.md status line updated from the
  stale "design phase".
- Scope note: at the user's direction, all external-event framing was removed — the docs
  present the MemoryAgent work on its own terms (`showcase.md` replaces the earlier
  submission-framed doc).
- Gates: typecheck ✅, Biome ✅ (3 pre-existing warnings), lines ✅, unit 187/187 ✅,
  eval 13/13 ✅, builds ✅.

## 2026-07-12 — AI SDK-native loop (Decision A)

- Audited the **installed** `ai@6.0.219` (`node_modules/ai/{dist,src,docs}` as source of
  truth): ToolLoopAgent, callOptionsSchema/prepareCall, prepareStep, custom StopConditions,
  structured output, tool approvals all present → `ai-sdk-integration-audit.md`, Decision A.
- **Loop migration** (`loop/{agent,call-options,stops}.ts`, `run-agent.ts` rewrite):
  ToolLoopAgent drives reasoning; `RunCallOptions` (Zod, SDK-validated via `validateTypes`)
  carries memory/resume/mode; `prepareCall` appends them as a second system message so the
  cached base prefix stays stable (`cache.ts` → `instructionsFor`, feeding `instructions`
  natively). Deterministic stack below the loop untouched.
- **Deliberately custom, documented in the audit**: the confirm gate stays (SDK
  `needsApproval` ends generation and needs a second model pass — verified in bundled docs —
  vs our in-execution pause); defineTool registry wraps SDK `tool()` for risk/capability
  metadata; ledger/verifier/policy/skills remain domain systems.
- **New stop conditions** (`stops.ts`, tested): `repeatedActionIs(3)` (identical call loop)
  and `uncertainStreakIs(3)` (acting without evidence), on top of budget caps + hard
  `stepCountIs`.
- **Progressive disclosure**: bundle now lists workflow metadata only; full steps load via
  the new `loadBrowserSkill` tool. **Memory feedback tools** `markMemoryUseful` /
  `markMemoryMisleading` bump ranking counters only (never trust/status/confidence —
  `store/feedback.ts`).
- Official skill installed (`npx skills add vercel/ai` → `.agents/`, untracked via
  .gitignore). Deferred with rationale: phase-based activeTools, approvals bridge,
  @ai-sdk/devtools, telemetry, subagent restructure.
- Gates: typecheck ✅, Biome ✅, lines ✅, unit **210/210** ✅, eval 13/13 ✅, builds ✅.

## 2026-07-12 — AI SDK migration phases 2–8 (autonomous loop)

- **§2**: `RunOptions.uiStream` dual-protocol seam; golden parity test (relay ↔
  `readUIMessageStream`) on one teed result.
- **§3**: `@ai-sdk/react@4.0.23` + `PortChatTransport` (tested: send shape, conversation
  tracking via `data-meta`, error→error-chunk, out-of-band confirms, abort); flagged ChatV2
  panel (`localStorage.inquisoChatV2`); confirm plumbing extracted to `chat/session-io.ts`.
- **§6**: evidence-citing `completeTask` (+`GoalVerified` ledger event) with `hasToolCall`
  stop; `guardedStep` forces observation-only tools after an all-uncertain step. Documented
  decision against a fatal-context stop (the model must be able to tell the user first).
- **§7 + §1.3**: dev-only `wrapLanguageModel` latency/usage middleware (bodies never logged);
  `@ai-sdk/devtools` evaluated — needs its own viewer process, not added.
- **§8**: `skillToAgentSkill` markdown adapter (uses `repairDiff` — dead-code flag resolved)
  + per-skill "Export .md" in the Memory Center.
- **§4-prep**: `toUIMessages` boundary adapter (tested) — ChatV2 loads and continues the
  latest conversation; scope/autonomy pickers; live memory/status; typed part rendering;
  visual smoke of the history view. Deletion of relay/recorder/reducer stays gated on a live
  ChatV2 demo cycle.
- **Cookbook sweep** (ai-sdk.dev/cookbook/guides): Agent-Skills guide → added discovery tool
  `listBrowserSkills`; Custom-Memory-Tool guide → recorded future item "mid-run memory
  refresh on origin change"; compaction guide already covered by `compactStep`.
- Gates at each commit: typecheck 0 · Biome 3 baseline warnings · lines ✅ · unit 228/228 ·
  eval 13/13 · both builds ✅.

## 2026-07-12 — Evidence-backed downloads, provenance display, hygiene (`2b5b81f`)

- `downloadFile`/`exportData` self-report `download_started` evidence; `runPlain` validates
  it with Zod, ledgers `OutcomeVerified` (verified_success + evidence), and advances the
  checkpoint — closing the day-1-2 audit High item. Tests prove malformed/failed results
  never fabricate verification (`self-evidence.test.ts`).
- Memory Center cards show provenance-of-use: `used N× · <last-used date>`.
- Repo hygiene: `.env.example` (documents the no-runtime-env-vars posture; deploy-script
  vars only) and `CHANGELOG.md` (unreleased milestone summary; versioned entries deferred
  to `changeset version`). Day-1-2 audit statuses refreshed (Day 1 ~95%, Day 2 ~90%).
- Gates: typecheck 0 · Biome 3 baseline · lines ✅ · unit 230/230 · eval 13/13 · builds ✅.

## 2026-07-12 — Full-codebase audit sweep + fixes (`253fe1c`)

Three parallel audits (architecture/hard-rules, security guardrails, AI SDK integration)
closed the autonomous implementation loop:

- **Architecture**: all boundary rules pass (core/ no DOM or ui/content imports; content/ no
  secrets; shared/ isolated; hooks centralized; zero TODOs; every `as any` suppressed with
  rationale). Noted deliberate exceptions: UI-gesture permission hooks and the same-origin
  attachment-blob read import core directly, documented in code.
- **Security**: secrets handling, page envelope, risk gate, sender validation (T6), CSP and
  MV3 permissions all pass. One confirmed gap fixed: `remember`'s hardcoded `explicit_user`
  provenance let injected text plant "user-confirmed" memories → un-overridable `confirmWhen`
  floor added (tested). Two theoretical tradeoffs now documented in security.md (click vs
  submit_form granularity; autopilot navigate/openTab URL exfiltration bounds).
- **AI SDK**: no migration phase overclaimed; no unjustified SDK duplication. Fixed the
  ranked gaps: repair-hook tests (`repair.test.ts`), toolCallId ledger-correlation acceptance
  test (`gate-ledger.test.ts`), dead `chatV2Enabled` re-export and unused `shadow`/`demo`
  execution modes removed, migration-plan/reinvention-audit docs refreshed (Phase 1 → DONE).
- Gates: typecheck 0 · Biome 3 baseline · lines ✅ · unit 236/236 · eval 13/13 · builds ✅.

Remaining (user-gated): ChatV2 attachment parity + a live demo cycle on the flag before the
Phase 4 deletion of relay/record/reducer; live-Qwen re-verification; automated
extension-restart e2e (manual procedure documented).

## 2026-07-12 — Folder-structure audit and regroup

Audited the tree against shallow-hierarchy conventions (≤7–10 subfolders per folder, files
within ~4 levels): `src/core` had sprawled to 18 flat subdirs (tests mirrored it with 13).
Regrouped by domain, no file contents changed:

- `core/data/` ← storage, settings, config, history, attachments, cache, sync (persistence).
- `core/providers/` ← embeddings, voice (model-serving adapters).
- `core/context/` ← prompts (envelope + rank — context assembly per docs/07's own definition).
- `shared/util/` ← base64, hash, slug, url, logger, i18n (generic helpers; domain schemas
  stay at `shared/` root).
- `tests/unit` mirrors every move; the Biome `noConsole` override path for `logger.ts`
  followed its file. Result: core 18 → 9 subdirs, nothing anywhere above 10.
- docs/07 tree redrawn + a new "Folder sizing discipline" section codifies the limits; all
  path references across docs updated.
- Gates: typecheck 0 · Biome 3 baseline · lines ✅ · unit 236/236 · eval 13/13 · builds ✅.

## 2026-07-12 — UI layer standardized; TanStack Query adopted

Researched (three subagents: React structure standards, TanStack-in-MV3 fit, data-hook map)
and implemented:

- **No `views/` folder** — per bulletproof-react/FSD/Wieruch a pages layer is a router
  artifact and the panel has no router. Instead the standard layers: `ui/app/` (mount +
  QueryClientProvider), `ui/lib/` (messaging, port transport, UIMessage mapping, query
  client + invalidation bridge), `ui/config/` (cross-feature display constants);
  single-consumer `provider-notice` moved into its feature.
- **TanStack Query v5 adopted** (~13 kB gz, zero transitive deps, CSP-clean; Router/Store/
  DB/Form evaluated and skipped). Seven data hooks + three components converted from
  hand-rolled fetch/refresh to cached queries + invalidating mutations: shared ['config']
  cache across side panel and options; Memory Center's five sequential fetches now parallel
  cached queries; voiceReady no longer permanently stale; tab/permission browser events
  invalidate centrally in `lib/invalidate.ts`; history list cached with proper invalidation
  (dead `onImported` plumbing deleted). Extension-tuned defaults: networkMode 'always',
  retry 0, staleTime 30 s.
- docs/02 (stale Zustand row replaced) and docs/07 (ui tree) updated.
- Gates: typecheck 0 · Biome 3 baseline · lines ✅ · unit 236/236 · eval 13/13 · builds ✅.

## 2026-07-13 — Readiness day: live harness, Devpost assets, honest verdicts

- Audit docs refreshed against the installed packages (`@ai-sdk/react` hook APIs verified by
  executing them from node_modules, not docs); stale "Requires dep" cells fixed.
- **Live cross-session harness** (`scripts/live-eval.mjs` + DEV-only SW hook in
  `core/chat/live-eval.ts`): drives the production turn path in real Chromium, real content
  script page reads, true browser-restart persistence. Learned: SW scope rejects dynamic
  `import()` — the hook is a static import, tree-shaken out of production (verified by grep
  on both bundles). Keyless + invalid-key runs prove all mechanics; results are only ever
  persisted from a real keyed run.
- e2e smoke fixed (asserted a heading removed by the empty-state redesign; the panel — with
  yesterday's QueryClientProvider — renders fully in the snapshot).
- Devpost assets: description, checklist (manual items flagged), judging-criteria map,
  architecture index.
- `docs/ai-sdk/daily-readiness-report.md` — exact verdicts; single blocker: DashScope key.
- Gates: typecheck 0 · Biome 3 baseline · lines ✅ · unit 236/236 · eval 13/13 · e2e 1/1 ·
  builds ✅.
