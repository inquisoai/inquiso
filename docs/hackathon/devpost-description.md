# Inquiso MemoryAgent — Devpost description (paste-ready)

> Tagline: **A browser agent that learns your browser — locally, verifiably, on Qwen.**

## Inspiration

Browser agents redo the same work every session: re-discover the same pages, re-plan the
same tasks, repeat the same mistakes. And "memory" features usually mean shipping your
browsing life to someone's server. We wanted an agent whose memory is *earned from verified
outcomes*, stays on your device, and provably makes the second attempt cheaper than the
first — powered end-to-end by Qwen Cloud.

## What it does

Inquiso is an open-source, cross-browser (Chrome/Firefox) MV3 extension: an AI side panel
that reads the page you're on and acts across the browser on your behalf. The MemoryAgent
layer adds:

- **An append-only event ledger** — every observation, action, permission decision, and
  verification is a typed, ordered event; per-run metrics are measured, never estimated.
- **Evidence-based outcome verification** — URL/title/element-state/download evidence
  decides `verified_success` / `verified_failure` / `uncertain`; *uncertain is never
  success*, in the verifier, in learning, and in what the model may claim.
- **Typed memory with provenance** — preferences, site facts, episodes, reflections, each
  with scope, confidence, temporal validity, and source events. A deterministic write gate
  discards secrets, quarantines page-supplied content, and asks before storing inferred
  preferences. The model proposes; the gate disposes.
- **Learned browser skills** — repeated verified successes become versioned, parameterized
  workflows that shadow-test before they're trusted, degrade on failure, and repair with
  history preserved.
- **A deterministic policy engine** — memory never authorizes anything; irreversible
  capabilities always re-confirm, no matter what any memory or skill says.
- **Cross-session proof** — restart the extension and the second run retrieves what the
  first one learned: measured 6→3→3 actions and 3→2→1 planning calls on the flagship task,
  0% prompt-injection success on the poisoning corpus (`pnpm evaluate:memory`).

## How we built it

- **Qwen Cloud (Alibaba Model Studio)**: `qwen-plus`/`qwen3-max` plan and act; `qwen-flash`
  runs background memory extraction; `text-embedding-v4` powers semantic retrieval — BYOK,
  encrypted at rest, via the OpenAI-compatible DashScope endpoint.
- **Vercel AI SDK v6** end to end: `ToolLoopAgent` with typed per-run call options
  (`callOptionsSchema`/`prepareCall` inject the retrieved memory bundle *before* planning),
  `prepareStep` context compaction, custom `stopWhen` conditions (budgets, repeated-action,
  uncertainty streaks, evidence-citing `completeTask`), `experimental_repairToolCall` for
  weak models, `embedMany` embeddings, `MockLanguageModelV3` loop tests, and an
  `@ai-sdk/react` `useChat` panel over a custom `runtime.Port` chat transport (there is no
  HTTP server anywhere).
- **WXT + React 19 + TypeScript strict + Zod** on every boundary; ≤100 lines per file.
- **Alibaba Cloud OSS** serves the controlled demo portals (v1→v2 site-change switch that
  proves staleness detection, supersession, skill degradation, and repair).

## Challenges we ran into

- Making "the task worked" a *verified* claim in a browser, where actions routinely lie
  (spinners, silent failures, stale DOM) — solved with before/after page-evidence deltas
  and self-reported evidence validated by schema, never trusted from the model.
- Memory poisoning: page text that tries to become memory. The deterministic gate +
  provenance labels + a confirmation floor on the one tool that can claim user intent got
  measured injection success to 0%.
- MV3 reality: service workers die mid-task (checkpoints + resume-with-revalidation),
  dynamic `import()` is banned in SW scope, and every UI surface must survive restarts.

## Accomplishments we're proud of

- The full loop is measurable and reproducible: one command regenerates every number we
  publish; a live harness drives the real extension through restart with nothing mocked.
- Security guardrails that survived an adversarial audit (deny-wins policy, ALWAYS_ASK
  capabilities, spoof-proof provenance).

## What we learned

Verified outcomes are the only trustworthy teacher for agent memory — everything else
(transcripts, model claims, page text) needs a deterministic gate between it and storage.

## What's next

Workspace/account-scoped memory dimensions, exact-URL retrieval tiers, mid-run memory
refresh on origin change, and broader skill repair.

## Built with

`qwen` · `alibaba-cloud` · `dashscope` · `vercel-ai-sdk` · `@ai-sdk/react` · `wxt` ·
`react` · `typescript` · `zod` · `tailwindcss` · `indexeddb` · `playwright` · `vitest`
