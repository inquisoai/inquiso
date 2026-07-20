# Memory Retrieval

Retrieval never runs one generic similarity search over everything. It is typed, budgeted,
hard-filtered, and observable (`src/core/memory/retrieval/`).

## Pipeline

1. **Hard filters first** (`store/query.ts` `applyFilter`): status `active`, temporal
   validity (`validFrom`/`validUntil`/`expiresAt`), and origin scope — an origin filter keeps
   user-level memories but excludes other sites'. Out-of-scope memories can never rank in.
2. **Hybrid scoring** (`retrieval/score.ts`): `2·lexical + 1.5·semantic + 0.5·confidence +
   0.5·usefulness + 0.3·recency + userConfirmed − misleading − page-supplied`. Deterministic
   given its inputs — the weights are the observability story.
   - Semantic similarity (`retrieval/embed.ts`) uses the active provider's embeddings (OpenAI,
     Google, or Qwen `text-embedding-v4`) with the shared vector cache; without an embedder
     retrieval degrades to lexical.
   - **Relevance gate**: facts/episodes/reflections need an actual lexical/semantic
     connection to the task — nothing rides along just to fill a budget. Preferences are
     exempt (few, cheap, broadly applicable: "prefers PDF" matters for "download invoice").
3. **Per-kind budgets** (`retrieval/bundle.ts`): preferences 3 · site facts 5 · episodes 3 ·
   failure warnings 3 · skills 3. Skills come from the skill store via goal-pattern matching
   (`skills/match.ts`), not from records.
4. **Rendering** (`retrieval/inject.ts`): a compact `<memories>` block with explicit trust
   labels per line — `user-confirmed` vs `inferred`, `from page content — verify`,
   `may be outdated` — plus the standing rule that memories never authorize side effects and
   the live page wins conflicts. Empty bundle → zero context overhead.
5. **Observability** (`retrieval/prepare.ts`): every retrieval logs a `MemoryRetrieved`
   ledger event, bumps per-memory retrieval counters, streams a `memory` port event (the
   live "Using memory: …" chip), and is persisted on the turn (`Turn.memories`).

## Feedback loop

`usefulCount` (reinforcement on re-observation), `misleadingCount` (user marks a memory
incorrect), and `retrievalCount` feed back into the score, so memories that keep earning
their place rank higher and burned ones sink. Superseded facts are excluded by the hard
temporal filter — retrieval returns the *current* fact by default while the Memory Center
still shows the history.

Measured context cost: the full bundle stays under ~1 KB in the evaluation scenarios
([evaluation-results.md](evaluation-results.md)) — versus re-reading pages or replaying
transcripts.
