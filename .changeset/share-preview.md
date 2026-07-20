---
"inquiso": minor
---

Show exactly what's shared with the model. A context bar above the composer
(the Gemini "Sharing 1 tab" pattern) gives an at-a-glance readout — "Sharing:
Example Domain" or "Sharing: 2 pages" — and the "+" menu lists each page in
scope with its title and host. Both are driven by the same resolveScopeTabs
the background uses to gather context, so the preview always matches what's
sent, and a tab-events hook keeps it live as you switch or navigate tabs.
