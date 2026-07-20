# Evaluation

Two complementary layers; measured numbers live in
[evaluation-results.md](evaluation-results.md) and regenerate with one command:

```bash
pnpm evaluate:memory
```

## Layer 1 — subsystem harness (automated, deterministic)

`tests/evaluation/` runs the **real** memory subsystem — event ledger, write pipeline,
episode/reflection learning, hybrid retrieval, and the full skill lifecycle — against a
deterministic simulator of the demo invoice portal, driven by a **scripted planner of
constant competence** (fixed policy: offered workflow → remembered fact → fixed-order
exploration). Only the DOM is simulated; every store, gate, ranking function, and state
machine is the production code.

What this isolates: differences between configurations measure *what the memory system
delivers to the planner*, with planner skill held constant. What it does not measure: LLM
behaviour, real token counts, wall-clock latency — those belong to the live demo.

Configurations: `no-memory` · `facts` · `facts+episodes` · `full` (checkpoint behaviour is
covered by unit tests — the simulator has no worker to kill).

Metrics per session: actions, failed actions, recoveries, planning calls, injected memory
context (chars), outcome. Plus scenario metrics: stale-fact supersession, skill degradation/
repair, injection block rate, duplicate rate.

The harness already paid for itself: it exposed a verdict mis-association bug in trajectory
normalization (a failed action could borrow the next action's success verdict) that unit
tests missed.

## Layer 2 — live demo measurements

Real runs record real metrics in the ledger (`RunMeta`: actions, failures, recoveries, model
calls, tokens from the provider) and the Memory Center's **Tasks** view displays them per
run — so the first-vs-repeated comparison shown in a live session is measured, not scripted.

## Unit coverage (Vitest, `pnpm test`)

Memory validation, scope filtering, temporal validity, supersession, deduplication,
sensitive-data rejection, gate rules, retrieval ranking + budgets, ledger ordering + GC,
checkpoint create/resume/interruption, outcome classification, trajectory normalization,
skill reliability/degradation/shadow/repair/lifecycle, policy decisions, and the adversarial
poisoning corpus — 187 tests as of the last build-log entry.
