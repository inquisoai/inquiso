# Devpost submission checklist

Repo-side items are DONE and verifiable in-tree; MANUAL items need the maintainer.

| Item | Status | Where / what to do |
| --- | --- | --- |
| Public open-source license | DONE | `LICENSE` (MIT) |
| Project description | DONE | paste from [devpost-description.md](devpost-description.md) |
| Installation steps | DONE | `README.md` → Build & run (`pnpm install`, `pnpm build`, load unpacked) |
| Qwen Cloud setup | DONE | `README.md` + `docs/03-providers-and-auth.md` (DashScope key via Settings → Models) |
| Alibaba Cloud deployment | DONE | `docs/deployment/alibaba-cloud.md` + `deploy/alibaba/deploy.sh` |
| Architecture docs + diagram | DONE | `docs/architecture.md` (index) · Mermaid sequence in `docs/ai-sdk/current-integration-map.md` |
| Memory architecture | DONE | `docs/memory-agent/overview.md`, `data-model.md`, `security.md` |
| AI SDK architecture | DONE | `docs/ai-sdk/` (capability matrix, integration map, migration plan) |
| Demo script | DONE | `docs/demo-script.md` (~3 min walkthrough) |
| Evaluation results (measured) | DONE | `docs/memory-agent/evaluation-results.md` — regenerate with `pnpm evaluate:memory` |
| Security explanation | DONE | `docs/05-security.md` + `docs/memory-agent/security.md` |
| Changelog / env example | DONE | `CHANGELOG.md`, `.env.example` |
| **Live run evidence** | **BLOCKED on key** | `INQUISO_QWEN_KEY=sk-... node scripts/live-eval.mjs` → writes `artifacts/evaluation/live-results.json` + fill `docs/memory-agent/live-evaluation-results.md` |
| **Repository visibility** | MANUAL | make the GitHub repo public before submitting |
| **Demo video (≤3 min)** | MANUAL | record per `docs/demo-script.md`; upload; paste URL into Devpost |
| **Screenshots** | MANUAL | side panel (chat + memory chip), Memory Center (memories/skills/blocked), portal v1→v2 recovery |
| **Deployed portal URL** | MANUAL | run `deploy/alibaba/deploy.sh` (needs `ossutil` + `OSS_BUCKET`); paste the OSS website URL |
| **Devpost form fields** | MANUAL | team, category/track, built-with tags (list at the end of devpost-description.md) |
