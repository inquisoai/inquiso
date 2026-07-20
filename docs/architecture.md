# Architecture

The authoritative architecture documentation is split by concern:

| Layer | Document |
| --- | --- |
| Runtime surfaces & message flow (MV3 background / content / UI) | [01-architecture.md](01-architecture.md) |
| Providers & auth (BYOK, Qwen Cloud, encryption) | [03-providers-and-auth.md](03-providers-and-auth.md) |
| Agent system (loop, tools, risk gate, trace) | [04-agent-system.md](04-agent-system.md) |
| Security model (threat table, guardrails) | [05-security.md](05-security.md) |
| MemoryAgent (ledger, verification, typed memory, skills, policy) | [memory-agent/overview.md](memory-agent/overview.md) |
| AI SDK integration (installed-version audit → runtime map) | [ai-sdk/current-integration-map.md](ai-sdk/current-integration-map.md) |
| Project layout & boundaries | [07-project-structure.md](07-project-structure.md) |

One paragraph for orientation: Inquiso is a serverless, local-first MV3 extension. The
background service worker is the brain — it runs the Vercel AI SDK `ToolLoopAgent` over the
user's own provider (Qwen Cloud first-class), executes every tool behind a deterministic
policy + confirmation gate, verifies outcomes against page evidence, and records everything
to an append-only event ledger that feeds the typed memory system. Content scripts are the
hands and eyes (no secrets); the React side panel is a thin streaming client over a typed
`runtime.Port`. There is no Inquiso server: keys stay encrypted on device, memory stays in
local IndexedDB, and the only cloud calls are the ones the user configured.
