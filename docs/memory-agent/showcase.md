# MemoryAgent Showcase

**What it is:** a browser-native agentic memory system inside Inquiso — an open-source,
local-first browser extension.

**Claim:** Existing browser agents can complete a task. Inquiso **remembers how** the task
was completed, learns from failures, adapts when a website changes, and performs the next
task more accurately with fewer actions and less model context.

## What the memory system adds

Everything below was built on top of the pre-existing Inquiso agent (M0–M5; the before-state
is documented in [current-architecture.md](current-architecture.md), every phase in
[build-log.md](build-log.md)):

| Capability | Where | See it |
| --- | --- | --- |
| Append-only typed event ledger + per-run metrics | `core/memory/ledger` | Memory → Tasks |
| Evidence-based outcome verification (uncertain ≠ success) | `core/agent/verify` | `OutcomeVerified` events with typed evidence |
| Checkpoints + interrupted-task resume with revalidation | `core/memory/checkpoint` | unit tests; resume note in prompt |
| Typed memory (scope, provenance, confidence, temporal validity) | `shared/memory`, `core/memory/store` | Memory Center |
| Deterministic write gate: secrets discarded, page content quarantined, preferences ask, dedupe reinforces, slots supersede | `core/memory/pipeline` | Memory → Blocked; poisoning tests 0% success |
| Episodes + failure reflections + model-assisted extraction (qwen-flash) | `core/memory/pipeline`, `core/memory/learn` | Memory → Knowledge after any run |
| Hybrid budgeted retrieval with trust labels + live "Using memory" | `core/memory/retrieval` | chip in transcript; `Turn.memories` |
| **Browser skills: learn → shadow → trust → execute → degrade → repair, versioned** | `core/memory/skills` | Memory → Workflows; staleness eval |
| Deterministic capability policy engine (memory never authorizes) | `core/policy` | Access settings; policy tests |
| Qwen Cloud first-class provider (chat, tools, qwen-flash routing, text-embedding-v4) | `core/providers/defs/qwen.ts` | Settings → Models |
| Memory Center (inspect/edit/confirm/forget/export/clear; workflows; blocked; tasks) | `ui/features/memory` | Settings → Memory |
| Controlled demo portals with a site-change switch | `demo/portals` (`pnpm demo`) | deployable to Alibaba OSS |
| Measured evaluation harness | `tests/evaluation` (`pnpm evaluate:memory`) | [evaluation-results.md](evaluation-results.md) |

## Measured results (regenerable, never hand-written)

From `pnpm evaluate:memory` — real memory subsystem, deterministic portal simulator,
constant-competence scripted planner:

- Repeated task (full system): **6 → 3 → 3 actions**, **3 → 2 → 1 planning calls**,
  failures 1 → 0 → 0; no-memory stays flat at 6/3.
- Site change with a trusted workflow: 9 actions / 4 failures (recovered, fact superseded) →
  degrade + repair → **3 actions / 0 failures / 1 planning call** on the changed site.
- Prompt-injection corpus: **0% success** (5/5 blocked). Duplicates after 5 identical
  observations: **0**. Memory context ≤ ~1 KB per run.

## Alibaba Cloud usage

- **Qwen Cloud (Model Studio / DashScope)** is the AI backend: `qwen-plus`/`qwen3-max` plan
  and act, `qwen-flash` does background memory extraction, `text-embedding-v4` powers
  semantic retrieval — all through the built-in provider, BYOK, key encrypted at rest.
- **OSS static website hosting** serves the demo portals + health check:
  [docs/deployment/alibaba-cloud.md](../deployment/alibaba-cloud.md), one-command
  `deploy/alibaba/deploy.sh`.
- There is deliberately **no other backend**: the memory system is fully local
  (serverless/local-first is a hard project rule) — inspectable, exportable, deletable.

## How this goes beyond OpenClaw-style memory

Inspectable local-first memory and background consolidation are the starting point (blocked-
attempt auditing, Memory Center, deterministic gates). Inquiso goes further on **browser-
native procedural memory**: workflows are *learned from evidence-verified trajectories*,
*shadow-tested* against independent runs before earning execution rights, *executed* through
the same policy/confirmation/verification stack as model actions, *reliability-scored*,
*degraded* instead of blindly retried when the site changes, and *repaired into preserved new
versions* — with temporal supersession keeping the site-fact layer current alongside them.

## Reproduce everything

```bash
pnpm install
pnpm check && pnpm typecheck && pnpm lines && pnpm test   # quality gates
pnpm evaluate:memory                                       # measured results
pnpm demo                                                  # portals for the live demo
pnpm build                                                 # chrome-mv3 + firefox-mv2
```

Demo walkthrough: [docs/demo-script.md](../demo-script.md) (≈3 minutes).

## Known limitations

- The live extension demo needs a real DashScope key and manual browser driving; the harness
  is the deterministic fallback. DashScope CORS from an extension worker is expected to work
  via the compatible-mode endpoint, but if a region blocks it, the custom-provider flow (with
  origin grant) is the workaround — untested against every region.
- Model-assisted extraction quality depends on qwen-flash; the deterministic episode/
  reflection path works without it.
- Skill locators are role/name-based; canvas-only UIs would need the vision path (qwen-vl is
  wired as a provider model but not exercised by the demo).
- Memory stores are local-only and unencrypted at rest (same posture as chat history);
  see [security.md](security.md).
