# React & Tool-Flow Audit (`@ai-sdk/react`, client-side tools)

## The architectural fact that decides everything

The canonical AI SDK client-tool pattern assumes:

```text
server (agent loop) ⇄ HTTP/UIMessage stream ⇄ browser client (executes tools via onToolCall)
```

Inquiso has **no server** (hard rule: serverless/local-first). The agent loop *already runs in
the browser* — inside the MV3 service worker — and tools execute in that same process with
direct `chrome.scripting`/`chrome.tabs` access, behind the deterministic policy gate
(`gatedExecute`). The React side panel is a display + input surface over a `runtime.Port`.

### Client-side tools (`onToolCall` + `addToolOutput` + `sendAutomaticallyWhen`): NOT RECOMMENDED

Adopting the client-tool flow would move tool dispatch out of the service worker into the
side panel. That is a strict regression here:

1. **Execution authority** would live in a closable, restartable UI document; today a run
   survives panel redraws because the SW owns it, and docs/05 T6 depends on the SW being the
   only privileged surface.
2. **Policy non-bypassability**: the gate runs *inside* the SW execute path; a panel-side
   executor would have to round-trip back to the SW anyway — adding a hop that exists only to
   recreate the current call graph with more failure modes.
3. The pattern exists to bridge a *remote* loop to a browser. Our loop is already co-located
   with the executor; there is nothing to bridge.

The evaluated "expected pattern" therefore collapses into the **current** architecture: the
ToolLoopAgent proposes; `gatedExecute` (policy → confirm → executor → verifier → ledger) runs
in-process; the result feeds the next step. The audit's checklist for a real click is already
answerable from the ledger: tool-call id (SDK), validated input (SDK Zod), policy result
(`PermissionRequested/Granted` events), single execution in the active tab (`ctx.tabId`),
independent verification (`OutcomeVerified` + evidence), loop continuation (next step), UI
state (relay → reducer tool parts). Correlation gap: SDK `toolCallId` is not currently written
into ledger events — see migration plan §1.

### `useChat` as panel state: MIGRATE INCREMENTALLY (post-demo)

What duplicates `@ai-sdk/react` today (the honest reinvention):

| Custom | Files (~lines) | `useChat` equivalent |
| --- | --- | --- |
| Stream part → UI event mapping | `loop/relay.ts` (64) | UIMessage chunks from `createAgentUIStream` |
| Turn recorder (persistence mirror) | `chat/record.ts` (82) | UIMessage persistence pattern |
| Session reducer + state | `ui/features/session/*` (~200) | `messages`, `status`, `error` |
| Port protocol envelope | `chat/protocol.ts`, `chat/port.ts` (~140) | custom `ChatTransport` (justified — no HTTP) |
| Send/abort/regenerate plumbing | `ui/hooks/use-session.ts` | `sendMessage`, `stop`, `regenerate` |

Adoption sketch (validated against installed types): the SW produces a UIMessage stream with
`createAgentUIStream(agent…)` (present in core `ai`), serializes chunks over the existing
Port; the panel installs `@ai-sdk/react` with a **custom `ChatTransport`** whose
`sendMessages` returns a `ReadableStream<UIMessageChunk>` fed by the Port. Confirmations stay
out-of-band on the same Port (they are an in-execution pause, not a chat message; SDK
approvals' two-pass protocol is documented as unsuitable in capability-matrix.md). Progress
("Reading the page…", "Using memory") becomes transient/persistent **data parts**; per-turn
metadata (taskId/runId/usage) becomes **message metadata**.

Why not now: the port protocol is working, tested, and mid-demo-hardening; the migration
touches every UI surface at once (transcript, thoughts, confirms, history reload) and its
payoff is maintainability, not demo capability. Risk class M–L. Scheduled as migration plan
§2–4 with rollback (both protocols can coexist behind the transport seam).

Per-area recommendations:

| Area | Recommendation |
| --- | --- |
| Streaming assistant output / message state / status / errors / cancellation | Migrate incrementally → `useChat` via custom Port transport |
| Regeneration | Migrate (currently manual re-send) |
| Typed tool parts in transcript | Migrate (reducer's trace items → tool parts) |
| Client-side browser tools | **Keep SW-side** (see above) |
| Approval state | Keep custom (in-execution pause) |
| Progress data / metadata | Migrate → data parts + metadata |
| Chat persistence | Keep Inquiso store; adapt to/from UIMessages at the boundary |
| Task (checkpoint) resumption | Keep Inquiso — distinct from chat stream resumption |

## Verdicts for this axis

```text
@ai-sdk/react adoption: MISSING (deliberate today; incremental adoption planned — client-tool flow NOT RECOMMENDED)
Client-side browser tool flow: NOT IMPLEMENTED — and architecture-inappropriate (no server; SW-co-located executor)
```
