# Inquiso

> Chat with any web page. Ask questions, get summaries, check trustworthiness, and let an
> agent take actions for you — using your own AI keys or your browser's built-in AI, without
> ever leaving the page.

Inquiso is an **open-source, cross-browser extension** (Chrome, Firefox, and Chromium-based
browsers) that adds an AI sidebar to your browser. It reads the page you're on — or a whole
tab group, or every tab in a window — and lets you:

- **Ask** — "What does this page say about refunds?"
- **Summarize** — "Give me the 5 key points."
- **Assess** — "Is this source trustworthy? What's the bias?"
- **Act** — "Fill this form with my details" / "Find the cheapest option and add it to cart."

You watch the agent **think and reason in real time** as it browses the page and works toward
an answer. Everything runs **locally in your browser** — there is no Inquiso server, no
telemetry, and no place your data is sent except directly to the AI provider you choose.

## MemoryAgent: an agent that learns your browser

Beyond completing tasks, Inquiso **remembers how** they were completed — locally, inspectably:

- **Cross-session memory** — typed facts, preferences, episodes, and failure lessons with
  scope, provenance, confidence, and temporal validity; retrieved per task with trust labels
  and shown live as *"Using memory: …"*.
- **Learned workflows** — repeated verified tasks become versioned browser skills that are
  shadow-tested, execute through the normal confirmation gates, **degrade** when a site
  changes, and **repair** themselves into new versions.
- **Evidence, not vibes** — an append-only event ledger records every action with verified
  outcomes (URL/element/download evidence); only verified success reinforces memory, and
  interrupted tasks resume from checkpoints with revalidation.
- **Deterministic safety** — secrets are never stored, page-planted "memories" are
  quarantined (0% injection success in the adversarial suite), and memory can never authorize
  an action: a capability policy engine + confirmation floors always stand between memory and
  side effects.
- **The Memory Center** — inspect, edit, confirm, forget, export, or delete everything,
  including blocked write attempts and per-run measured metrics.

Start at [docs/memory-agent/overview.md](docs/memory-agent/overview.md); the measured results
live in [evaluation-results.md](docs/memory-agent/evaluation-results.md).

## Why Inquiso

- **Bring your own model.** Use a free local model (Chrome Built-in AI / Gemini Nano), or
  bring your own API key for OpenAI, Anthropic, Google, Qwen, or Kimi. You stay in control of cost and data.
- **Transparent agent.** Every reasoning step and every action the agent takes is shown to
  you. Sensitive actions require your confirmation.
- **Fast.** Built on WXT + Vite + React with aggressive, memory-aware caching so the sidebar
  opens instantly and answers stream immediately.
- **Private & secure by design.** Manifest V3, strict CSP, least-privilege permissions,
  encrypted key storage, and first-class prompt-injection defenses.

## Status

🚧 **Pre-1.0, actively built.** Milestones M0–M5 are implemented; the agent and cloud paths
need real-browser testing before a tagged release.

| Milestone | What landed |
| --- | --- |
| M0 | WXT + React + TypeScript scaffold, CI, hooks, cross-browser builds |
| M1 | Read & answer — Readability extraction, cache, Chrome Built-in AI, grounded chat |
| M2 | Bring your own model — encrypted keys, OpenAI/Anthropic/Google via AI SDK, picker |
| M3 | The transparent agent — tools, element handles, risk gate, live reasoning trace |
| M4 | Multi-scope context — page / tab group / window, ranking, memory budget |
| M5 | Opt-in OAuth (PKCE) scaffold, i18n, a11y, e2e harness |

### Build & run

```bash
pnpm install
pnpm dev            # Chrome with HMR (load .output/chrome-mv3 if prompted)
pnpm dev:firefox    # Firefox
pnpm build          # production builds for Chrome + Firefox
pnpm check && pnpm typecheck && pnpm test   # quality gates
```

Then load the built extension in your browser and open the sidebar. The step-by-step install,
model setup (BYOK), and how to use every feature are in the **[User Guide](docs/10-user-guide.md)**.

## Using Inquiso

New here? Start with the **[User Guide](docs/10-user-guide.md)** — installing from source,
picking a model (free on-device or your own key), asking & acting, autonomy and permissions,
attachments, voice, MCP tools, and moving/backing up your chats (export/import and
bring-your-own-cloud backup).

## Documentation

Read the design before contributing code:

| Doc | What's inside |
| --- | --- |
| [User Guide](docs/10-user-guide.md) | Install & use every feature (start here if you're not coding) |
| [Vision](docs/00-vision.md) | Product goals, scope, non-goals |
| [Architecture](docs/01-architecture.md) | High-level system design & data flow |
| [Tech Stack](docs/02-tech-stack.md) | Every tool we use and why |
| [Providers & Auth](docs/03-providers-and-auth.md) | BYOK, OAuth, Chrome AI, ToS reality |
| [Agent System](docs/04-agent-system.md) | The reasoning/action loop and tools |
| [Security](docs/05-security.md) | Threat model & defenses |
| [Caching & Memory](docs/06-caching-memory.md) | Speed & browser memory budget |
| [Project Structure](docs/07-project-structure.md) | Folder layout & conventions |
| [Coding Standards](docs/08-coding-standards.md) | Style, commits, file-size rules |
| [Roadmap](docs/09-roadmap.md) | Milestones |
| [MemoryAgent overview](docs/memory-agent/overview.md) | The memory system: ledger, retrieval, skills |
| [Memory data model](docs/memory-agent/data-model.md) | Records, events, checkpoints, skills |
| [Memory security](docs/memory-agent/security.md) | Poisoning defence, policy engine |
| [Browser skills](docs/memory-agent/browser-skills.md) | Learn → shadow → execute → degrade → repair |
| [Evaluation](docs/memory-agent/evaluation.md) | Harness design + [measured results](docs/memory-agent/evaluation-results.md) |

## License

[MIT](LICENSE) — see also [SECURITY.md](SECURITY.md) and [CONTRIBUTING.md](CONTRIBUTING.md).
