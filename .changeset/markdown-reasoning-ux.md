---
"inquiso": patch
---

Render answers as markdown and tame the reasoning UI. Assistant answers,
persisted turns, and the reasoning trace now render through react-markdown
(GFM: bold, lists, code, tables, blockquotes) instead of showing literal
`**` and `#`. The Thoughts section follows the ChatGPT/Claude pattern —
collapsed by default, auto-expanded only while the model is thinking and
auto-collapsed when done (unless the user pins it), in a muted low-overload
card — so verbose chain-of-thought no longer dominates the view.
react-markdown emits no raw HTML and needs no eval, so the locked CSP is
unaffected.
