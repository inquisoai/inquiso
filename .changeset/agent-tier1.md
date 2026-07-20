---
"inquiso": minor
---

Smarter, cheaper, more capable agent loop (AI SDK v6):

- **Vision** — a `screenshot` tool captures the visible tab and hands the image
  to the model via `toModelOutput`, so a vision-capable model can read charts,
  maps, and canvas/image-only UI the DOM text can't express. Offered only when
  the active model can see images (tools can now opt out of a run).
- **Context compaction** — a per-step `prepareStep` prunes bulky older tool
  output and stale reasoning while keeping the recent working set, so long
  multi-step runs on token-heavy pages stay within budget.
- **Tool-call repair** — `experimental_repairToolCall` re-asks the model to fix
  malformed tool arguments instead of failing the step (helps weak/on-device
  models).
- **Prompt caching** — the stable system prefix is marked with an Anthropic
  `cacheControl` breakpoint, cutting BYOK cost and latency on long runs; other
  providers cache automatically.
- **Concurrency cap** — `maxParallelCalls` limits simultaneous tool executions.
