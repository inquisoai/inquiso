---
"inquiso": minor
---

Cross-session memory retrieval and learning, plus first-class Qwen (DashScope) support. After
each run the agent learns from the persisted event ledger: an evidence-linked episode, slot-
keyed failure reflections, and (with a fast model like qwen-flash) extracted site facts and
inferred preferences — all through the deterministic write gate. Before each run, a typed,
per-kind-budgeted memory bundle (hard scope filters → hybrid lexical/semantic/trust ranking)
is injected with explicit trust labels, shown live as "Using memory: …", and persisted on the
turn. Qwen ships as a built-in provider (chat, tool calls, qwen-flash extraction routing,
text-embedding-v4 embeddings).
