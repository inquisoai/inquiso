# 00 — Vision & Scope

## The problem

People increasingly ask an AI assistant about the things they read online — but doing so today
means copy-pasting page content into a separate ChatGPT/Claude/Gemini tab, losing context, and
switching back and forth. AI browser sidebars exist, but most are closed-source, route your
data through a vendor's server, lock you into one model, and give you no visibility into what
the "agent" actually did.

## The product

**Inquiso** is an in-browser AI sidebar and agent. It understands the page (or tabs) you're
looking at and answers questions, summarizes, evaluates trustworthiness, and — when you ask —
performs actions on the page on your behalf. It is model-agnostic and runs entirely client-side.

### Core capabilities

1. **Page Q&A** — Ask anything about the current page; answers are grounded in the page's
   actual content with citations back to the relevant section.
2. **Summarize & assess** — One-click summaries, key-point extraction, and a "trustworthiness"
   read (source signals, citations, tone/bias, claims that need verification).
3. **Multi-scope context** — Chat with: the current page, a selected **tab group**, or **all
   tabs** in the current window. Context is assembled and de-duplicated across sources.
4. **Transparent agent** — A reasoning/action loop that browses and operates the page (click,
   type, scroll, navigate, extract). The user sees each thought and each action as a live
   trace; sensitive or irreversible actions require explicit confirmation.
5. **Your model, your key** — Default to free local **Chrome Built-in AI**; optionally bring
   your own API key (OpenAI / Anthropic / Google) or use an officially-supported OAuth flow.

## Principles

- **Local-first & serverless.** No Inquiso backend. The extension talks directly to the
  provider you configure. We never see your data, keys, or prompts.
- **Transparency over magic.** Show the reasoning. Show the actions. Ask before doing anything
  consequential.
- **Least privilege.** Request the narrowest permissions that work; prefer `activeTab` and
  optional host permissions granted per-site by the user.
- **ToS-honest.** We do not ship features that violate provider terms or put users' accounts at
  risk. See [Providers & Auth](03-providers-and-auth.md).
- **Fast.** Perceived latency is a feature. Cache aggressively, stream always, lazy-load.

## In scope (v1)

- Cross-browser MV3 extension (Chrome, Edge, Brave, Firefox).
- Sidebar chat grounded in page/tab(s) content.
- Summarize / ask / trustworthiness flows.
- Agent loop with a curated tool set and human-in-the-loop confirmation.
- Chrome Built-in AI + BYOK providers via the Vercel AI SDK; opt-in OAuth where permitted.
- Memory-aware caching layer.

## Out of scope (for now)

- Any Inquiso-hosted server, account system, or sync.
- Reselling/relaying model access; using subscription OAuth where it violates provider ToS.
- Autonomous actions without user confirmation on sensitive operations.
- Mobile browsers (revisit when Chrome Android Built-in AI matures).

## Success criteria

- Sidebar opens in **< 150 ms**; first answer token in **< 1 s** on a cached page.
- Zero data leaves the device except to the user-chosen provider endpoint.
- A new contributor can build and run the extension in **< 5 minutes**.
