# Changelog

Inquiso is pre-1.0 and unreleased; versioned entries will be generated from the pending
[Changesets](.changeset/) (`pnpm changeset version`) at the first tagged release. Until then
this file summarizes the unreleased history at milestone granularity — the authoritative
per-change log is `git log` (Conventional Commits) and `docs/memory-agent/build-log.md`.

## Unreleased

### MemoryAgent (2026-07)

- Append-only typed event ledger with per-run metrics; evidence-based outcome verification
  (URL/title/element-state/download evidence; uncertain is never success); task checkpoints
  with cross-restart resume and revalidation.
- Typed memory (preferences, facts, site knowledge, episodes, reflections) with scope,
  provenance, confidence, and temporal validity; deterministic write gate (secrets discarded,
  page-derived content quarantined, inferred preferences ask, duplicates reinforce,
  conflicting slots supersede with history); Memory Center UI with blocked-attempt auditing.
- Cross-session retrieval: hard scope/temporal filters, hybrid lexical/semantic/trust
  ranking, per-kind budgets, live "Using memory" transparency.
- Browser skill engine: repeated verified tasks become versioned workflows with semantic
  locators and typed parameters; shadow testing, reliability scoring, degradation, and
  repair with preserved version history; discovery/activation tools and Agent-Skill
  markdown export.
- Deterministic capability policy engine (deny wins; irreversible capabilities always
  re-confirm; grants only via the extension UI) and memory-poisoning defenses (0% measured
  injection success).
- Qwen (DashScope) as a first-class provider: chat + tool calls, qwen-flash extraction
  routing, text-embedding-v4 retrieval embeddings.
- Controlled demo portals (`pnpm demo`) with a site-change switch; measured evaluation
  harness (`pnpm evaluate:memory`); Alibaba Cloud OSS deployment for the portals.

### AI SDK-native runtime (2026-07)

- The browser reasoning loop runs on `ToolLoopAgent` (ai@6.0.219) with typed, SDK-validated
  per-run call options; loop-health stop conditions (repeated calls, uncertainty streaks),
  evidence-citing `completeTask` completion, and forced re-observation after uncertain steps.
- SDK `toolCallId` correlation across policy/action/verification ledger events; mock-model
  loop tests; dev-only model-call logging middleware.
- `@ai-sdk/react` panel preview behind a flag: `useChat` over a custom Port `ChatTransport`,
  with a history→UIMessage boundary adapter.

### Pre-existing base (M0–M5, 2026-06 and earlier)

WXT + React extension scaffold; page reading with citations; BYOK multi-provider support;
the transparent agent (tools, risk gate, live trace); multi-tab context; opt-in OAuth
scaffold, i18n, e2e harness. See `docs/09-roadmap.md`.
