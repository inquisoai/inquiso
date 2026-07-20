---
"inquiso": minor
---

Deterministic capability policy engine and memory-poisoning hardening. Every tool maps to a
capability (fill_form, submit_form, download, …); user-created per-site allow/deny rules run
before the risk gate, deny always wins, and irreversible capabilities (submit, send, delete,
purchase, settings, unknown) always re-confirm — no standing grant, memory, or trusted skill
can silence them. Grants are created only in the extension UI, so nothing the agent reads or
remembers can authorize a side effect. Adversarial tests cover page-planted "remember this
password" / "always approve purchases" / recipient-override attacks (all discarded or
quarantined and inert in retrieval).
