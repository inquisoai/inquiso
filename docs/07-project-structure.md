# 07 — Project Structure

Feature-first, small files, clear boundaries. The golden rule (see
[Coding Standards](08-coding-standards.md)) is **≤ 100 lines per file** — this layout is
designed so that's natural, not painful.

```
inquisoai/
├─ docs/                      # this documentation set
├─ src/
│  ├─ entrypoints/            # WXT entrypoints (one concern each)
│  │  ├─ background.ts        # service worker bootstrap → wires core modules
│  │  ├─ content.ts           # content-script bootstrap
│  │  ├─ sidepanel/           # React side panel app
│  │  │  ├─ index.html
│  │  │  └─ main.tsx
│  │  └─ options/
│  │
│  ├─ core/                   # the brain — runs in background, no DOM
│  │  ├─ agent/               # loop, tools, verifier, subagents, MCP
│  │  ├─ auth/                # BYOK key store, encryption, permission grants
│  │  ├─ chat/                # session port, run orchestration, protocol
│  │  ├─ context/             # scope resolution, tab aggregation, page envelope, ranking
│  │  ├─ data/                # persistence: storage, settings, config, history,
│  │  │                       #   attachments, cache, sync
│  │  ├─ memory/              # ledger, checkpoints, memory store, pipeline,
│  │  │                       #   retrieval, browser skills
│  │  ├─ messaging/           # typed, Zod-validated message contract + router
│  │  ├─ policy/              # deterministic capability policy engine
│  │  └─ providers/           # AI SDK adapters (+ embeddings, voice)
│  │
│  ├─ content/                # the hands & eyes — runs in page (isolated world)
│  │  ├─ extract/             # Readability + a11y/DOM map + Turndown
│  │  └─ actions/             # click/type/scroll/navigate executors + handles
│  │
│  ├─ ui/                     # shared React (bulletproof-react shape, no views/
│  │  │                       #   layer — screens are feature roots, no router)
│  │  ├─ app/                 # app shell: mount/bootstrap + context providers
│  │  ├─ components/          # presentational, small, reusable
│  │  ├─ config/              # display constants shared by 2+ features
│  │  ├─ features/            # chat, memory center, settings, session, …
│  │  ├─ hooks/               # ALL React hooks (never colocated in features/)
│  │  └─ lib/                 # infra adapters: messaging, port transport,
│  │                          #   UIMessage mapping, query client + invalidation
│  │
│  ├─ platform/               # cross-browser adapters (sidepanel vs sidebar, offscreen)
│  ├─ shared/                 # framework-free domain schemas (Zod) + memory/ + util/
│  └─ styles/                 # Tailwind entry + tokens
│
├─ tests/
│  ├─ unit/                   # Vitest
│  └─ e2e/                    # Playwright (loads built extension)
│
├─ .github/                   # workflows, issue/PR templates, CODEOWNERS
├─ wxt.config.ts              # WXT + manifest config (per-browser overrides)
├─ biome.json                 # lint + format + rules (incl. max-lines)
├─ tsconfig.json              # strict TS, path aliases
├─ package.json
├─ pnpm-lock.yaml
├─ LICENSE                    # MIT
├─ SECURITY.md
├─ CONTRIBUTING.md
├─ CODE_OF_CONDUCT.md
└─ README.md
```

## Boundary rules (enforced by lint + review)

- **`core/` never imports `ui/` or `content/`** and never touches the DOM. It's pure logic +
  extension APIs.
- **`content/` holds no secrets** and never imports `core/auth`.
- **`ui/` talks to `core/` only through `core/messaging`** (typed contract), never directly.
- **`shared/` imports nothing from the other top-level dirs** — it's the dependency sink.
- **`platform/` is the only place `chrome.*`/`browser.*` quirks are branched on.**

## Naming

- Files: `kebab-case.ts`; React components: `PascalCase.tsx`.
- One primary export per file; co-locate its types and tiny helpers.
- Unit tests live under `tests/unit/`, mirroring the `src/` tree (e.g. `tests/unit/core/auth/`); e2e flows under `tests/e2e/`.

## Folder sizing discipline

Small files (≤ 100 lines) multiply files, so the tree needs its own limits:

- **Breadth**: a folder holds at most **10 subfolders** (aim for 7). When a layer sprawls past
  that, group by domain — the way persistence modules live under `core/data/` — never by
  file type.
- **Depth**: files stay within **4 levels of `src/`** (e.g. `core/agent/tools/act/*.ts`).
  If a change wants a fifth level, flatten or regroup instead.
- Folder names say what the system *does* (agent, memory, policy), not what technology it
  uses. `tests/unit/` mirrors `src/` exactly, so these limits apply there automatically.

## Module size discipline

Each leaf folder is a set of single-purpose files. If a file approaches 100 lines, split by
responsibility (e.g. `agent/loop.ts`, `agent/step.ts`, `agent/registry.ts`,
`agent/risk-gate.ts`) rather than growing it.
