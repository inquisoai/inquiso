---
"inquiso": minor
---

Make tools and subagents a proper registry so contributors can add them
neatly. Each tool is now a self-contained `defineTool({...})` file (name,
description, risk, schema, handler) registered in one array; the registry
applies the confirmation gate uniformly from each tool's declared risk — so
risk can't drift from behaviour and an action tool can't ship un-gated (the
old split between `tools.ts` and a separate risk table is gone). Adds a
subagent registry: a `SubagentDef` is exposed to the main agent as an
`ask_<id>` delegation tool that runs a focused nested turn with its own prompt
and a read-only tool subset (one-level handoff). Documented in docs/04 with an
"adding a tool/subagent" contributor guide.
