# Runtime Verification Plan

What must be proven at runtime (not from source), how to reproduce it, and what is already
proven vs pending. Honest status: **source + unit/eval evidence exists for everything below;
the post-ToolLoopAgent-migration live-Qwen trace is pending the next manual demo run.**

## Adapted proof run (reflects the real architecture)

The prompt's canonical proof assumes `useChat` + client tools + a server. Inquiso's
architecture (audited in react-tool-flow.md) has no server and executes tools in the service
worker, so the equivalent proof is:

### Setup
```bash
pnpm build          # chrome-mv3 with the ToolLoopAgent loop
pnpm demo           # portals on http://localhost:8788
```
Load `.output/chrome-mv3` unpacked; add a DashScope key (Settings → Models → Qwen,
`qwen-plus`); Memory → Delete all memory; portal hub → invoice portal, **Version 1**.

### Steps and per-step evidence

| # | Claim | Where the evidence appears |
| --- | --- | --- |
| 1 | Side panel sends the request | user turn renders; `SendRequest` validated (a malformed port message is logged + dropped) |
| 2 | Request reaches a real ToolLoopAgent | `loop/agent.ts` is the only loop; breakpoint or `@ai-sdk/devtools` (post-adoption) — interim: run completes with multi-step budget events |
| 3–4 | Qwen selects tools across steps | transcript trace shows `readPage`/`queryElements` → act tools; `Tasks` view `modelCalls > 1` |
| 5–6 | Tool executes once, in the active tab, via the SW | ledger `ActionStarted` (one per call) with `toolCallId` (after migration-plan §1.1) |
| 7 | Policy evaluated | `PermissionRequested/Granted` events; deny by adding an Access rule and observing `policy_denied` |
| 8 | Outcome independently verified | `OutcomeVerified` + `url_changed`/`element_state_changed` evidence in the run's events |
| 9 | Result feeds the next step | subsequent step references the result (transcript); loop continues without user input |
| 10 | Memory context injected via typed call options | "Using memory:" chip; `MemoryRetrieved` ledger event; second session uses fewer planning steps |
| 11 | Final answer streams | transcript; `TaskCompleted` + RunMeta metrics |
| 12 | Learning persisted across restart | reload the extension; Memory → Knowledge shows the episode/facts; repeat task → chip + fewer actions |

Full three-session arc: `docs/demo-script.md` (improvement → trust → v2 staleness →
degrade/repair), each phase leaving ledger evidence in Memory → Tasks.

### Automated layers backing the manual proof

- `pnpm test` — 210 unit tests incl. loop call-options/stops, gate, verifier, policy.
- `pnpm evaluate:memory` — 13 scenario tests over the real subsystem (improvement, staleness/
  repair arc, safety), measured results regenerated into `evaluation-results.md`.
- Landed (migration plan §1): `ai/test` mock-model loop tests (`agent.test.ts`: memory via
  call options reaches instructions, invalid options rejected pre-model-call, repeated-action
  stop) and toolCallId correlation. Still pending: the automated extension-restart e2e (also
  flagged in `day-1-2-audit.md`).

## Correlation identifiers

Present today: `taskId` (=conversation), `runId`, `eventId`+`seq`, checkpoint (by taskId),
episode→`runIds`/`eventIds`, skill→`learnedFrom.runIds`, per-run metrics.
Since Phase 1 landed: SDK `toolCallId` is written onto Permission*/Action*/Outcome* ledger
events (`gatedExecute` → `runLogged`/`runPlain`). Still missing: `chatId`/`messageId` (arrive
only with the useChat migration); `agentStep` derivable from budget events (steps counter).

## Final verdicts (per §25 definitions — VERIFIED requires runtime trace)

```text
AI SDK version health: HEALTHY
@ai-sdk/react adoption: PARTIAL (flagged ChatV2 at near-parity over PortChatTransport; client-tool flow NOT RECOMMENDED)
Client-side browser tool flow: NOT IMPLEMENTED (architecture-inappropriate — no server)
ToolLoopAgent adoption: COMPLETE (source + unit tests; live-Qwen re-trace pending next demo run)
Tool approval integration: PARTIAL (deterministic policy engine tested + authoritative; SDK approvals deliberately unadopted, documented)
AI SDK observability: PARTIAL (dev middleware latency/usage logging + onStepFinish metering + canonical ledger with toolCallId correlation; devtools viewer not installed — documented)
Unnecessary reinvention: MODERATE→LOW (the replacement useChat layer is built and tested behind a flag; the duplicate retires at §4 after a live cycle)
Ready to implement migration plan: YES
```
