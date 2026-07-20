---
"inquiso": minor
---

Controlled demo portals and a measured evaluation harness. `pnpm demo` serves a static invoice
portal (accounts, paginated invoice table, PDF/CSV downloads, and a v1/v2 navigation switch:
Settings→Billing vs Account→Billing) plus an expense portal (upload, category, amount, draft,
confirmed submit). `pnpm evaluate:memory` runs the real memory subsystem — ledger, learning,
retrieval, skill lifecycle — against a deterministic portal simulator with a constant-
competence scripted planner, and writes measured results to
docs/memory-agent/evaluation-results.md: repeated-task improvement per memory configuration,
the full stale→recover→supersede→degrade→repair arc, 0% injection success, and 0 duplicates.
