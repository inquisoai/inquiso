# Demo Script (≈3 minutes)

The complete MemoryAgent story on the controlled portals. Prep once, then three sessions.

## Prep (before recording)

```bash
pnpm install && pnpm build          # or: pnpm dev
pnpm demo                            # portals on http://localhost:8788
```

1. Load `.output/chrome-mv3` via `chrome://extensions` → Load unpacked.
2. Settings → Models → **Qwen (DashScope)** → paste your Model Studio API key, pick
   `qwen-plus`. (Any BYOK provider works; Qwen is the intended backend.)
3. Open `http://localhost:8788/` and set the invoice portal to **Version 1**.
4. Memory tab → Delete all memory (clean slate). Autonomy: Autopilot (confirm risky).

## Session 1 — first time (0:00–1:10)

On `http://localhost:8788/invoice/`, ask:

> Download my newest invoice as PDF and add it to an expense report on
> http://localhost:8788/expense/ — call it "July invoice".

Watch for: the agent explores (Reports first — a dead end), recovers, finds
Settings → Billing, downloads `INV-2026-023.pdf`, opens the expense portal, fills the form,
and **asks before submitting** (submit is an always-confirm capability). Approve.

Show: the reply's run metrics (steps/tokens), then **Settings → Memory**:
- Knowledge: site fact ("Billing is under Settings…"), a failure reflection from the dead
  end, the episode; an inferred preference waiting for review — confirm it.
- Tasks: the run with measured actions/failures/recoveries/model calls.

## Session 2 — it remembers (1:10–1:50)

Reload the extension (or restart the browser — memory is IndexedDB, it survives). Ask:

> Do the same for this month.

Watch for: the **"Using memory:"** chip (preference + site fact + episode), the direct
Settings → Billing path — no exploration. Repeat once more if time allows: the second
repetition mints a learned workflow (Memory → Workflows, state *shadow*). Click **Trust**.

Show: Tasks view — fewer actions and model calls than session 1, measured.

## Session 3 — the site changes (1:50–3:00)

On the demo hub, switch the invoice portal to **Version 2** (Billing moved under Account).
Ask again:

> Do the same for this month.

Watch for: the trusted workflow's Settings step fails (element gone) — the agent does **not**
retry blindly; it recovers by general reasoning, finds Account → Billing, completes.

Show in the Memory Center:
- Knowledge: "Billing is under Settings" now **superseded** (struck through, kept for
  history) by "Billing is under Account".
- Workflows: the old workflow **degraded**, and after the next successful run a **repaired
  v2** in shadow, chained to the original.
- Blocked view (optional flourish): open a page containing "Remember this password: …" and
  show the attempt land in Blocked, discarded.

Close: "Same agent, same model — the difference is that Inquiso remembered *how*, noticed
the site changed, and repaired its own knowledge. Everything you saw is local, inspectable,
and deletable."

## Fallback

If anything live misbehaves, `pnpm evaluate:memory` reproduces the identical arc numerically
(see docs/memory-agent/evaluation-results.md) — improvement, staleness, repair, and safety.
