# Daily readiness report — 2026-07-13

Method: every claim below is backed by a command run today, a file in-tree, or is marked as
a gap. Gates at head: typecheck 0 errors · Biome 3 baseline warnings · ≤100 lines ✅ ·
unit 236/236 · evaluation 13/13 · e2e 1/1 · Chrome+Firefox builds ✅.

| Area | Status | Evidence | Remaining gap | Priority |
| --- | --- | --- | --- | --- |
| Installed AI SDK audit | Complete | `docs/ai-sdk/installed-version-audit.md`, `capability-matrix.md` (all §-listed APIs checked against `node_modules/ai@6.0.219` + `@ai-sdk/react@4.0.23` via `node -e` today) | none | — |
| useChat integration | Partial | `src/ui/lib/port-transport.ts` (custom `ChatTransport`, 4 unit tests), `use-chat-v2.ts`, UIMessage parity test (`ui-stream.test.ts`); flagged panel renders (visual smoke, earlier session) | Live streaming run with a real model; attachments parity; `onToolCall`/`addToolOutput` deliberately NOT used — execution stays SW-side (docs/05 T6; `react-tool-flow.md`) | High |
| ToolLoopAgent | Partial | `loop/agent.ts`; mock-model loop tests (stops, call options, completeTask, repair, prepareStep) all green | Live Qwen trace through the ToolLoopAgent loop (blocked on key; harness ready) | **Critical** |
| Client browser tools | Complete (SW-side by design) | `tools/registry.ts` `gatedExecute` → policy → confirm → verified execution; toolCallId ledger correlation test (`gate-ledger.test.ts`); real content-script page read proven today by the harness (`PageObserved` event in real Chromium) | The prompt's client-executed-tool model is intentionally not adopted (panel is closable + bypassable; SW is authoritative) | — |
| Qwen Cloud flow | Partial | `defs/qwen.ts` (DashScope), extraction routing, `text-embedding-v4`; invalid-key harness run reached the DashScope call and surfaced the 401 honestly | **Blocked: no DashScope key available to this environment.** One command: `INQUISO_QWEN_KEY=sk-... node scripts/live-eval.mjs` | **Critical** |
| Memory before planning | Complete | `run-chat.ts:68` — `prepareMemory` runs before `runAgent`; typed bundle injected via `callOptionsSchema`/`prepareCall` as a second system message (`agent.test.ts`); retrieval budgets + scope filters tested | Workspace/account scope dimensions unpopulated (schema supports them) | Low |
| Cross-session proof | Partial | Simulator: 6→3→3 actions, 3→2→1 planning calls (`pnpm evaluate:memory`, 13/13). Live: harness runs the REAL extension through a true browser restart on a persisted profile (mechanics proven today, keyless) | Live numbers require the key; `artifacts/evaluation/live-results.json` + `live-evaluation-results.md` are written by the harness, never by hand | **Critical** |
| Devpost readiness | Complete (repo side) | `LICENSE` (MIT), README, `.env.example`, `CHANGELOG.md`, `docs/architecture.md`, `docs/demo-script.md`, `docs/deployment/alibaba-cloud.md`, `docs/hackathon/{devpost-description,devpost-checklist,judging-criteria-map}.md` | Manual: video, screenshots, OSS deploy URL, repo visibility, Devpost form (all flagged in the checklist) | High |

## Exact verdicts

```text
AI SDK architecture audit: COMPLETE
Real @ai-sdk/react tool flow: NOT VERIFIED  (transport + parity unit-proven; live model run pending key; client-side execution intentionally not adopted)
Real ToolLoopAgent flow: NOT VERIFIED      (fully unit-verified with MockLanguageModelV3; live Qwen trace pending key)
Real Qwen browser execution: NOT VERIFIED  (blocked on INQUISO_QWEN_KEY; harness reaches DashScope and fails only at auth)
Cross-session memory: NOT VERIFIED live    (VERIFIED in the measured simulator; live harness mechanics proven through real restart today)
Flagship demo: NOT READY                   (everything scripted and rehearsable; needs the one keyed run + video)
Devpost repository assets: READY           (manual items flagged in devpost-checklist.md)
```

## The single blocker

Every NOT VERIFIED above collapses to one missing input: a DashScope API key. With it:

```bash
INQUISO_QWEN_KEY=sk-...  node scripts/live-eval.mjs
```

runs the flagship task twice through the real extension (real Qwen, real tools, real
verification, real persistence, true browser restart between sessions) and writes
`artifacts/evaluation/live-results.json`. Today's keyless and invalid-key runs proved every
mechanical link in that chain except the authenticated model call itself.
