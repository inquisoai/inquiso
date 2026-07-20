# MemoryAgent Overview

> Existing browser agents can complete a task. Inquiso **remembers how** the task was
> completed, learns from failures, adapts when a website changes, and performs the next task
> more accurately with fewer actions and less model context.

This document is the map; details live in [data-model.md](data-model.md),
[retrieval.md](retrieval.md), [browser-skills.md](browser-skills.md),
[security.md](security.md), and [evaluation.md](evaluation.md). What was built when (and what
was pre-existing Inquiso) is recorded in [build-log.md](build-log.md) and
[current-architecture.md](current-architecture.md).

## Principles (non-negotiable)

1. **Memory is not chat history.** Durable memories are structured, scoped, deduplicated,
   inspectable records with provenance — never raw transcripts or DOM dumps.
2. **Memory informs, never authorizes.** Side effects pass the deterministic policy engine +
   confirmation gate every time; no memory, skill, or page content can create a permission.
3. **Page content is untrusted.** Anything website-supplied enters memory quarantined at best.
4. **Success must be verified.** Only evidence-backed outcomes (URL change, element state,
   download, …) reinforce memory or skills; *uncertain is never success*.
5. **Local-first.** Every store is IndexedDB in the browser; inspect, edit, forget, export,
   and disable it all in the Memory Center. Nothing syncs anywhere.

## Architecture

```mermaid
flowchart TD
  U[User request] --> O[Page observer<br/>content/extract]
  O --> R[Memory retrieval<br/>core/memory/retrieval]
  R --> CB[Context builder<br/>labeled memories block]
  CB --> P[Planner — agent loop<br/>core/agent/loop, Qwen/BYOK]
  P --> PE[Policy engine + risk gate<br/>core/policy + tools/registry]
  PE --> X[Browser executor<br/>tools/act → content/actions]
  X --> V[Outcome verifier<br/>core/agent/verify]
  V --> L[(Event ledger<br/>core/memory/ledger)]
  L --> CK[Checkpoints<br/>core/memory/checkpoint]
  L --> ME[Learning<br/>core/memory/learn + pipeline]
  ME --> S[(Facts · episodes · reflections<br/>core/memory/store)]
  ME --> SK[(Skills<br/>core/memory/skills)]
  S --> R
  SK --> R
```

## Memory lifecycle

```mermaid
flowchart LR
  RUN[Run events<br/>verified outcomes] --> CAND[Candidates<br/>episode · reflection · facts]
  USER[Explicit user request] --> CAND
  CAND --> GATE{Deterministic gate}
  GATE -- secrets --> DISCARD[discarded + logged]
  GATE -- page-derived --> QUAR[quarantined<br/>until user confirms]
  GATE -- inferred preference --> ASK[candidate<br/>asks the user]
  GATE -- verified --> DEDUP{duplicate?}
  DEDUP -- yes --> REINF[reinforce existing]
  DEDUP -- slot conflict --> SUP[supersede old<br/>validUntil + link]
  DEDUP -- no --> ACTIVE[active]
  ACTIVE --> RETR[retrieval bundle]
  RETR --> RUN
```

## First run vs repeated run

```mermaid
sequenceDiagram
  participant U as User
  participant A as Agent
  participant M as Memory
  U->>A: "Download my newest invoice…" (first time)
  A->>A: explores navigation, one recoverable failure
  A->>M: ledger events → episode + failure reflection + site fact
  U->>A: "Do the same for this month." (new session)
  M->>A: preferences + site fact + episode + learned workflow
  A->>A: direct path, fewer actions, fewer model calls
  A->>U: result + "Using memory: …" + measured run metrics
```

Measured effect (harness, see [evaluation-results.md](evaluation-results.md)): 6→3→3 actions
and 3→2→1 planning calls across three sessions; after a site change, 9 actions with 4
failures (recovered) degrades and repairs the workflow back to 3 actions with 0 failures.

## What lives where

| Concern | Package |
| --- | --- |
| Typed schemas (records, events, skills, checkpoints) | `src/shared/memory/` |
| Event ledger + run metrics | `src/core/memory/ledger/` |
| Checkpoints + resume | `src/core/memory/checkpoint/` |
| Write pipeline (gate, dedupe, supersede, episodes, reflections, extraction) | `src/core/memory/pipeline/` |
| Retrieval (filters, hybrid ranking, bundle, prompt injection) | `src/core/memory/retrieval/` |
| Skill engine (learn, shadow, execute, degrade, repair) | `src/core/memory/skills/` |
| Outcome verifier | `src/core/agent/verify/` |
| Policy engine | `src/core/policy/` |
| Providers + fast-model routing | `src/core/providers/`, `extraction.ts` |
| Memory Center UI | `src/ui/features/memory/` |
| Evaluation harness | `tests/evaluation/` |
