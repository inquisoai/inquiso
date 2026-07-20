# Day 1 & Day 2 Audit — MemoryAgent Foundation

Audited 2026-07-12 at commit `a460ef2`, read-only (no code modified). Method: gate commands run
fresh (outputs below), execution path traced end-to-end, dead-code/mocks/TODO sweeps run,
runtime evidence distinguished from unit-test evidence. A feature is **Complete** only when it
is wired into the real run path (`run-chat.ts` → agent loop → verifier → ledger → learn →
retrieve) *and* tested.

## Day 1

| Requirement | Status | Evidence | Gaps | Priority |
| --- | --- | --- | --- | --- |
| Architecture docs exist & accurate | **Complete** | `docs/memory-agent/current-architecture.md` (stack, MV3+MV2, SW ephemerality/rehydration, `ContentMsg` content-script protocol, executor via `sendToTab`+handles, agent loop internals, tool-calling via `defineTool`/registry, provider integrations, localforage/IndexedDB + encrypted keys, auth, tests, CI/deploy). `implementation-plan.md` maps every module to real paths; both written against commit `34430b3` baseline with measured gate results | Doc predates later phases by design (phases logged in `build-log.md`); SW lifecycle covered in one paragraph, not deep | Low |
| Event ledger — integrated, append-only | **Complete** | `src/shared/memory/events.ts` (31 event types incl. all 6 required; envelope: id, taskId, runId, seq, at, actor, type, page, typed payload, evidence, redaction flag). Writers: `run-ledger.ts` (chained writes → on-disk order = emission order), wired into every tool call via `gatedExecute` → `runLogged` (`registry.ts:28`, `verify/run.ts`) and run lifecycle in `run-chat.ts`. Persisted in IndexedDB store `ledger` + `runs` index; retrievable post-restart (Memory → Tasks reads `listRuns()` live). Tests: `ledger.test.ts` (seq contiguity, order, metrics, origins, GC-with-events) | Post-restart retrieval proven by real UI usage + IndexedDB semantics, not by an automated restart test | Medium |
| Outcome verifier — execution ≠ success | **Partial → mostly Complete** (updated 2026-07-12) | `src/core/agent/verify/{snapshot,delta,classify,run}.ts`: before/after snapshots, pure `classify()` → `verified_success/verified_failure/uncertain`; **uncertain is never success** (enforced in classification, in skill reinforcement via `normalize.ts` `isVerified`, and since `a460ef2` in the system prompt for narration). URL change ✅, element state/appearance ✅ (incl. typed-value mismatch = verified failure), title change ✅. Tests: `classify.test.ts` (8 cases) | ~~download evidence~~ **closed 2026-07-12**: `downloadFile`/`exportData` self-report `download_started` evidence, Zod-validated in `runPlain` and ledgered as `OutcomeVerified` (tested: `self-evidence.test.ts`; malformed/failed results never fabricate verification). Remaining: `text_appeared` still has no runtime producer (types exist) | **High** |
| Typed memory models, Zod-validated | **Complete** | `src/shared/memory/`: `record.ts` (preferences/facts/site_knowledge/episodes/reflections/skills as `MemoryRecord` kinds), `skill.ts` (`BrowserSkill`), `checkpoint.ts`, `candidate.ts`, `events.ts`, `evidence.ts`, `locator.ts` — all Zod; every store read is `safeParse` (corrupt → treated absent: `records.ts:13`, `store.ts` everywhere); model output parsed against schemas (`extract.ts` `Extraction.parse`) | Checkpoints are a separate store rather than a `MemoryKind` (deliberate; documented in data-model.md) | Low |
| Day 1 tests & quality gates | **Complete** | See "Exact verification evidence" — typecheck 0 errors, Biome 3 pre-existing warnings, 197/197 unit (44 files), 13/13 eval, both builds pass, ≤100-lines rule passes. Ordering: `ledger.test.ts`; persistence semantics: ledger/checkpoint/memory store tests (in-memory localforage mock); verification: `classify.test.ts`; schema validation: `events.test.ts`, `query.test.ts`, gate/admit tests | "Integration tests" are subsystem-level (real modules, mocked storage/DOM); no extension-runtime e2e beyond the sidepanel smoke test | Medium |
| Checkpoint engine (optional Day 1) | **Complete** | `src/core/memory/checkpoint/{store,service}.ts`; wired: `run-chat.ts` starts/finishes checkpoints, `verify/run.ts` advances on verified success only; interruption = active checkpoint under a different runId; `resumeNote()` injected into the next run's prompt demanding re-observation. Tests: `checkpoint.test.ts` (5 cases incl. interruption detection and note content) | Resume-after-real-SW-kill exercised only at unit level | Medium |

## Day 2

| Requirement | Status | Evidence | Gaps | Priority |
| --- | --- | --- | --- | --- |
| Memory repositories (CRUD, IDs, timestamps) | **Partial** | `src/core/memory/store/{records,query,mutate}.ts` (memories incl. preferences/facts/episodes/reflections), `skills/store.ts`, `checkpoint/store.ts`, `ledger/store.ts`, `policy/store.ts`. Stable prefixed ids (`ids.ts`), full temporal block on every record, create/read/update/delete + status transitions, capped GC. Business logic never touches localforage directly — everything goes through `appStore()` (`storage/instance.ts`) and the store modules | (1) **Delete is real, not soft** — deliberate repo rule (docs/06 "clears are real deletes"); status machine (`superseded/expired/quarantined`) covers non-destructive retirement, but the literal requirement differs. (2) **No schema version field or migration framework** on `MemoryRecord`/`BrowserSkill` (only `Checkpoint` has `v:1`); corrupt/old records degrade to "absent" instead of migrating. (3) Repository is a module boundary, not a swappable interface | Medium |
| Extraction pipeline (events→verify→candidates→policy→store) | **Complete** | Exact flow in code: verified events (`ledger`) → `learnFromRun()` (`learn.ts`, called at `run-chat.ts:89`) → deterministic episode (`episode.ts`) + reflections (`reflect.ts`) + model extraction (`extract.ts`) → **deterministic gate** (`gate.ts`: secrets discarded, page-derived quarantined, low-confidence discarded) → dedupe/supersede → store. Every record carries provenance (source, eventIds, runIds, url), confidence, scope, timestamps. **Inferred preferences are never silently stored** — gate forces `ask_user` (tested: `gate.test.ts` "asks the user before storing an inferred preference"); only explicit user requests store directly. Live-proven this week: real runs produced episodes/reflections/facts visible in Memory Center | Quality guards were added reactively after live findings (env-error reflections, read-only episodes, vacuous model facts — all now filtered + swept); more such classes may exist | Low |
| Memory retrieval (filters, ranking, typed bundle) | **Complete** | `retrieval/{bundle,score,embed,inject,prepare}.ts`: hard filters **before** ranking (status, temporal validity/expiry, origin — other-site memories excluded while user-level kept; `query.ts` `applyFilter`, tested in `query.test.ts` + `retrieval.test.ts`); hybrid rank = lexical + semantic (when embedder) + confidence + recency + **previous usefulness** − misleading − page-supplied; relevance gate stops budget-filling; typed `MemoryBundle` separates preferences/siteFacts/episodes/warnings/skills; wired pre-plan at `run-chat.ts:67` with `MemoryRetrieved` ledger event + live "Using memory" chip | No workspace/account dimensions populated yet (schema supports them); no exact-URL tier (origin-level only) | Low |
| Cross-session persistence (real runtime) | **Partial** | Runtime chain fully wired (retrieve → plan → verify → learn → store, all in `run-chat.ts`); storage is real IndexedDB (`unlimitedStorage`); **observed working live in this project's own testing**: memories written in one session appeared in "Using memory" in later sessions and *survived multiple extension reloads* (including unwanted junk — which persisted until an explicit sweep, itself proof of durability). Reproducible manual procedure: `docs/demo-script.md` sessions 1–2 | **No automated test drives the real extension through restart→retrieve** (eval harness uses an in-memory localforage mock, so it proves logic, not durability; e2e suite is a render smoke test). This is the requirement's explicit bar — treat as open | **High** |
| Deduplication | **Complete** | `admit.ts`: Jaccard ≥0.8 on same kind+scope → `reinforceMemory` (confidence bump + usefulCount, no new record); same `slotKey` conflict → temporal supersession (old kept, `validUntil` closed, contradiction links). Tests: `admit.test.ts` ("reinforces a duplicate instead of duplicating", "supersedes a conflicting slot"), `safety.eval.test.ts` (5 identical observations → exactly 1 active record, measured 0 duplicates) | Similarity is lexical only; paraphrased duplicates could slip past 0.8 without an embedder | Low |
| Qwen-powered extraction (optional) | **Complete (fully integrated)** | Not mocked: `providers/defs/qwen.ts` (DashScope, `fastModel: 'qwen-flash'`), routed by `providers/extraction.ts`, consumed by `extract.ts` with Zod-validated structured output. **Ran against real Qwen this week** — its output (including one junk fact) was observed live, which triggered the deterministic `fact-filter.ts` guard now in front of it. Deterministic episode/reflection path works with no model at all | Extraction quality depends on qwen-flash; only facts/preferences extracted by model (episodes/reflections deterministic by design) | Low |
| Memory inspector | **Partial (usable, user-facing)** | Memory tab (`ui/features/memory/`): kind, scope/origin, confirmed-vs-inferred, confidence %, status, first-observed date, "stays on this device", grouped sections + Workflows (state, reliability, steps, repair chain, Trust/Retire) + Tasks (per-run measured metrics) + Blocked (rejected writes with reasons) + edit/confirm/mark-incorrect/forget/export/delete-all/auto-learn toggle | ~~lastUsedAt/retrieval count~~ **closed 2026-07-12** (shown on MemoryCard). Remaining: source-run navigation links | Medium |
| Devpost/repo requirements | **Partial** | LICENSE (MIT) ✅; README updated with MemoryAgent section + doc table ✅; setup in README + `docs/deployment/alibaba-cloud.md` ✅; architecture docs + **Mermaid diagrams incl. extension/memory/Qwen/OSS/storage** (`overview.md`, `deployment/alibaba-cloud.md`) ✅; additions clearly labelled vs pre-existing in `showcase.md` + `current-architecture.md` + `build-log.md` ✅ (deliberately *not* labelled "Hackathon" — removed on user instruction) | ~~`.env.example`~~ and ~~`CHANGELOG.md`~~ **closed 2026-07-12** (env example documents the no-env-vars posture + deploy vars; CHANGELOG summarizes unreleased milestones and defers versioned entries to `changeset version` at first release) | Medium |

## Overall status

- **Day 1: ~95%** (updated 2026-07-12 — download evidence wired + tested). Open: `text_appeared`
  producer, extension-runtime integration tests.
- **Day 2: ~90%** (updated 2026-07-12 — inspector provenance + hygiene files closed). Open:
  automated real-runtime restart test, soft-delete/migration deviations (documented).

Percentages count only connected, tested functionality; documentation and schemas alone were
not credited.

## Critical blockers (for the canonical flow)

`complete task → verify → create memory → persist → restart → retrieve` **works today** — it
was exercised live repeatedly this week (including surviving reloads well enough that *bad*
memories needed a sweep to remove). Nothing blocks demonstrating it manually via
`docs/demo-script.md`. What blocks *proving* it automatically:

1. No e2e test drives the real extension (real IndexedDB, real background) through
   restart→retrieve. The existing background hardening (tab-sender rejection, docs/05 T6)
   makes naive Playwright probing fail by design; an e2e path needs the real side panel or a
   test-only handshake.
2. `downloadFile` outcomes are unverified at runtime — for the flagship invoice-download demo,
   the download step's success is currently structural (`ok:true`), not evidence-backed.

## False-completion risks

| Looks done | Reality |
| --- | --- |
| `ActionEvidence` supports downloads/text/network/records | Only url/title/element evidence is produced at runtime; `download_started` is emitted **only by the eval simulator**; `network_response`/`record_appeared`/`custom_validator` have zero producers |
| `pnpm evaluate:memory` "proves persistence" | It proves pipeline logic across simulated sessions on an **in-memory** localforage mock — durability comes only from real-runtime use |
| `repairDiff()` (skill repair diff for UI) | Implemented + documented, **never called** — Memory Center doesn't render step diffs |
| `SkillStep.action: 'waitFor'` | Executable in replay, but `normalize.ts` never emits it — dead branch until skills learn waits |
| `LedgerEvent.redacted` flag | Schema field exists; no writer ever sets it (redaction happens by omission instead) |
| `MemoryScope.workspaceId` / `tabId` | Schema-supported, never populated |
| Memory export button | Exports memories JSON, but there is no import path (unlike chat history transfer) |

## Exact verification evidence

Commands (2026-07-12, commit `a460ef2`):

| Command | Result |
| --- | --- |
| `pnpm typecheck` | ✅ 0 errors (`tsc --noEmit` clean) |
| `pnpm check` | ✅ 368 files, 0 errors, 3 warnings (pre-existing complexity: `errors.ts`, `relay.ts`, `Transcript.tsx` — predate this work) |
| `pnpm lines` | ✅ all files ≤100 lines |
| `pnpm test` | ✅ **44 files, 197/197** |
| `pnpm evaluate:memory` | ✅ 3 files, 13/13; regenerated `evaluation-results.md` |
| `pnpm build` | ✅ chrome-mv3 (7.57 MB) + firefox-mv2 (7.68 MB) |
| TODO/mock sweep | `grep -rniE 'todo|fixme|placeholder|not implemented'` over `src/` → only UI input `placeholder=` attributes; no code TODOs/mocks |
| Evidence-producer sweep | `grep -rn "'download_started'\|'text_appeared'\|…" src/` → no producers outside the schema (eval simulator lives in `tests/`) |
| Runtime wiring | `grep learnFromRun\|prepareMemory src/core/chat/` → `run-chat.ts:67` (retrieval pre-plan), `run-chat.ts:89` (post-run learning) |

Key test names: `ledger.test.ts` "persists events in emission order with contiguous seq";
`checkpoint.test.ts` "detects an interruption only for a different, still-active run";
`classify.test.ts` "a dispatched click with no observable change is uncertain, not success";
`gate.test.ts` "asks the user before storing an inferred preference", "quarantines
website-supplied content even when marked store"; `admit.test.ts` "reinforces a duplicate
instead of duplicating", "supersedes a conflicting slot"; `retrieval.test.ts` "an origin filter
excludes other sites but keeps user-level memories"; `poisoning.test.ts` (attack corpus);
`staleness.eval.test.ts` (v1→v2 degrade/repair arc); `fact-filter.test.ts` (vacuous-fact guard).

Manual runtime evidence (this week, real Chrome + real Qwen): permission-blocked run →
grant CTA → successful summarize; memories persisted across multiple extension reloads;
retrieval chips ("Using memory: …") showed episodes/reflections/facts from prior sessions;
qwen-flash extraction produced live output (and one junk fact, now filtered + swept).

## Recommended next actions (unfinished work only, prioritized)

1. **[High] Wire download verification**: emit `download_started` evidence from the real
   `downloadFile`/`exportData` tools (Chrome `downloads.onCreated`), add them to the verified
   set — the flagship demo's key step should be evidence-backed.
2. **[High] Automated cross-session e2e**: Playwright flow against the real extension +
   demo portals — run task → assert memory rows → reload extension → assert retrieval. Needs a
   test-only side-panel driver or launch-flag-gated handshake that doesn't weaken the
   tab-sender guard.
3. **[Medium] `text_appeared` collector**: cheap variant — verifier compares a page-text
   snippet expectation (or drop the type from the schema until produced, to avoid
   false-completion).
4. **[Medium] Inspector provenance**: show `lastUsedAt`, retrieval/useful counts, and link a
   memory to its source run in the Tasks view; render `repairDiff` in the Workflows view (or
   delete the helper).
5. **[Medium] Repo hygiene**: add `.env.example` (documenting `OSS_BUCKET`/`OSS_REGION` and
   "no runtime env vars — keys via UI") and generate/commit `CHANGELOG.md` from the 14 pending
   changesets (`changeset version`).
6. **[Medium] Schema versioning**: add `v` to `MemoryRecord`/`BrowserSkill` + a migration shim
   (the sweep pattern in `store/migrate.ts` is the natural home).
7. **[Low] Decide soft-delete policy**: either implement status-based soft delete with a
   purge, or document the real-delete deviation as an ADR (it is currently a deliberate
   docs/06 rule).
8. **[Low] Trim dead surface**: `network_response`/`record_appeared`/`custom_validator`
   producers or removal; populate or drop `redacted`, `workspaceId`.

## Verdict

```text
Day 1: NOT COMPLETE  (~92% — verifier evidence coverage for downloads/text missing at runtime)
Day 2: NOT COMPLETE  (~85% — no automated real-runtime restart test; repo hygiene files; migrations)
Ready to proceed to browser skill learning: YES
```

"YES" because the skill engine (learn → shadow → trust → execute → degrade → repair) is in
fact already implemented and measured (Phase 4, `skills/`, staleness eval) — none of the open
Day 1/2 gaps block it. The two High items above should land before the demo is recorded, since
they harden exactly the steps the demo showcases.
