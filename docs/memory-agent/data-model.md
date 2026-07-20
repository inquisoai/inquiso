# Memory Data Model

All schemas are Zod (`src/shared/memory/`), validated on every read — a corrupt record is
treated as absent, never trusted. All stores are localForage object stores inside the one
IndexedDB database `inquiso` (`src/core/data/storage/instance.ts`); deletes are real deletes.

## Memory hierarchy

| Layer | Store | Lifetime |
| --- | --- | --- |
| Current observation | in-memory page cache (`core/data/cache`) | until the page materially changes |
| Working memory | agent-loop messages + compaction | one run |
| Checkpoints | `checkpoints` (one per task) | until the task completes |
| Event ledger | `ledger` + `runs` | last 100 runs, GC'd together |
| Semantic / episodic / reflection | `memories` (2000 cap, usefulness-aware trim) | until forgotten/expired |
| Procedural (skills) | `skills` (versions preserved) | until retired/trimmed |
| Policy grants | `policies` | until the user removes them |
| Blocked write attempts | `memory-blocked` (50 cap, redacted) | rolling |

## MemoryRecord (`shared/memory/record.ts`)

The one durable memory shape, for kinds `preference | fact | site_knowledge | episode |
reflection | skill`:

- `scope` — `task | tab | origin | site | workspace | user | global` plus the ids; **hard
  filters** run on scope before any ranking.
- `summary` + `searchableText` — the one-line statement and the lexical retrieval text.
- `slotKey` — deterministic conflict key (e.g. `billing-location`): two active memories with
  the same kind+scope+slot contradict; the newer **supersedes** the older.
- `provenance` — source (`explicit_user | browser_observation | successful_episode |
  failed_episode | consolidation`), ledger `eventIds`, `runIds`, optional URL.
- `trust` — `confidence` (0–1), `sensitivity` (`public → financial`), `userConfirmed`,
  `websiteSupplied` (the poisoning flag).
- `temporal` — created/updated/observed/lastUsed plus `expiresAt`, `validFrom`, `validUntil`.
  A superseded fact keeps its record with `validUntil` closed and a `contradictedById` link.
- `metrics` — retrieval/useful/misleading counters feeding the ranking loop.
- `status` — `candidate | active | quarantined | superseded | expired | deleted`.

## MemoryCandidate (`shared/memory/candidate.ts`)

What the model or a pipeline stage may *propose*. Its `recommendedDecision` is advisory; the
deterministic gate (`core/memory/pipeline/gate.ts`) decides `store | ask_user | quarantine |
discard` and cannot be overridden (see [security.md](security.md)).

## Event ledger (`shared/memory/events.ts`)

Append-only, seq-numbered `LedgerEvent`s keyed `runId:seq` — the source of truth for
execution history. 31 event types cover the task lifecycle (`TaskCreated…TaskAborted`),
permissions, actions with verification (`ActionStarted/Succeeded/Failed`,
`OutcomeVerified/Uncertain` with typed `ActionEvidence`), checkpoints, memory decisions
(`MemoryPromoted/Superseded/Rejected/Quarantined`), and the skill lifecycle
(`SkillCandidateCreated/Executed/Degraded/Updated/Repaired`). `RunMeta` aggregates per-run
metrics: actions, failures, recoveries, model calls, tokens, origins.

## Evidence (`shared/memory/evidence.ts`)

`ActionEvidence` union: `url_changed`, `title_changed`, `element_state_changed`,
`text_appeared`, `download_started`, `network_response`, `record_appeared`, `user_confirmed`,
`tool_error`, `custom_validator`. Verifier verdicts are `verified_success |
verified_failure | uncertain` — and uncertain is never treated as success.

## Checkpoint (`shared/memory/checkpoint.ts`)

One per task (task = conversation): goal, owning runId, `lastSeq` into the ledger, last page,
verified `completedSteps`. An `active` checkpoint found by a *different* run marks an
interruption; the resume note demands re-observation and forbids repeating verified side
effects. Completion removes the checkpoint.

## BrowserSkill (`shared/memory/skill.ts`)

See [browser-skills.md](browser-skills.md): versioned steps with layered semantic locators
(`shared/memory/locator.ts`), typed `{{inputs}}`, preconditions, success criteria,
capabilities, reliability counters, and the state machine
`draft → shadow → verified → trusted` with `degraded`/`retired`, versions chained via
`previousVersionId`.
