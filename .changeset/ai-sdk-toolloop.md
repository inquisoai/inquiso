---
"inquiso": minor
---

The browser agent now runs on AI SDK's ToolLoopAgent (installed ai@6.0.219) instead of a
hand-assembled streamText loop. Per-run context (retrieved memory block, resume note,
execution mode) travels as typed call options that the SDK validates on every call and
prepareCall injects as a second system message — keeping the base instructions a stable,
cacheable prefix. New loop-health stop conditions halt stuck runs (same tool call repeated,
consecutive all-uncertain steps) alongside the existing step/wall-clock/token budgets.
Learned workflows switch to progressive disclosure: retrieval offers compact metadata and the
new loadBrowserSkill tool loads full steps only when a skill is selected; the model also gains
narrow markMemoryUseful/markMemoryMisleading feedback tools (ranking counters only — never
trust, status, or confidence). Everything privileged stays below the loop: policy gate,
confirmation, execution, verification, and the ledger are unchanged. Decision record and
installed-API evidence in docs/memory-agent/ai-sdk-integration-audit.md.
