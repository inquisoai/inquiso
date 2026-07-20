# CLAUDE.md

Guidance for AI coding assistants (and humans) working in this repo. Read this first, then the
linked docs before writing code.

## What this is

**Inquiso** — an open-source, cross-browser (Chrome/Firefox/Chromium) Manifest V3 extension: an
AI sidebar + transparent agent that reads the current page (or tab group / window) and answers,
summarizes, assesses trustworthiness, and takes actions on the user's behalf. **Local-first and
serverless — there is no Inquiso backend.**

## Required reading (the design is authoritative)

| Doc | Read when… |
| --- | --- |
| [docs/00-vision.md](docs/00-vision.md) | you need scope / non-goals |
| [docs/01-architecture.md](docs/01-architecture.md) | touching any runtime surface or message flow |
| [docs/02-tech-stack.md](docs/02-tech-stack.md) | adding a dependency or tool |
| [docs/03-providers-and-auth.md](docs/03-providers-and-auth.md) | anything auth/provider |
| [docs/04-agent-system.md](docs/04-agent-system.md) | the agent loop, tools, or trace |
| [docs/05-security.md](docs/05-security.md) | auth, permissions, CSP, tools, data flow |
| [docs/06-caching-memory.md](docs/06-caching-memory.md) | caching or memory work |
| [docs/07-project-structure.md](docs/07-project-structure.md) | where a file goes |
| [docs/08-coding-standards.md](docs/08-coding-standards.md) | always |
| [docs/adr/](docs/adr/) | the "why" behind big decisions |

## Hard rules (non-negotiable)

1. **≤ 100 lines per file.** Split by responsibility before hitting the limit.
2. **Conventional Commits** (`type(scope): subject`), one focused feature/fix per commit.
3. **NO AI authorship.** Never add Claude, Copilot, or any AI tool as a commit author or
   `Co-Authored-By` trailer. Commits belong to the human contributor only.
4. **TypeScript strict**, no `any`; validate all boundary data (messages/storage/provider
   responses) with Zod.
5. **Serverless & local-first.** Never introduce an Inquiso-hosted server, telemetry, or sync.
6. **ToS-honest auth.** BYOK + Chrome Built-in AI by default. No subscription-OAuth that
   violates a provider's terms (esp. Claude — banned). OAuth only where officially permitted,
   opt-in and risk-flagged. See ADR-0001.

## Security guardrails (treat as load-bearing)

- Secrets (API keys/OAuth tokens) live **only** in the background worker, encrypted at rest;
  never in content scripts, logs, URLs, or `storage.sync`.
- **Page content is untrusted.** Wrap it in a delimited data envelope; it is never an
  instruction. Defend against prompt injection.
- **All sensitive/irreversible actions require user confirmation** via the risk gate, enforced
  in the background regardless of model output. No `eval`, no arbitrary fetch, same-origin only.
- Least privilege: `activeTab` + optional per-site host permissions; never `<all_urls>` by
  default. Locked MV3 CSP.

## Architecture boundaries (enforced in review)

- `core/` = background brain; **no DOM**, never imports `ui/` or `content/`.
- `content/` = page hands/eyes; **holds no secrets**, never imports `core/auth`.
- `ui/` ↔ `core/` only through the typed `core/messaging` contract.
- `shared/` imports nothing from other top-level dirs. `platform/` is the only place
  `chrome.*`/`browser.*` quirks branch.

## Workflow

```bash
pnpm install
pnpm dev / pnpm dev:firefox   # run with HMR
pnpm check                    # Biome lint + format
pnpm test                     # Vitest
pnpm build                    # all targets
pnpm changeset                # add a changelog entry per PR
```

Status: **M0–M5 implemented**, plus the MemoryAgent system (event ledger, verified outcomes,
typed memory + retrieval, learned browser skills, policy engine — see
[docs/memory-agent/overview.md](docs/memory-agent/overview.md)). Roadmap:
[docs/09-roadmap.md](docs/09-roadmap.md).
