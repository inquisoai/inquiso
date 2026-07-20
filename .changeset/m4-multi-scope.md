---
"inquiso": minor
---

M4 — Multi-scope context. Chat can now be grounded in the current page, the
active tab group, or all tabs in the window. Tabs are extracted lazily (cached
+ coalesced), de-duplicated by content hash, ranked by lexical relevance to the
question, and trimmed to a character budget so multi-tab scopes never overflow
the context window. Adds a scope picker to the side panel and a "Clear cache"
control in Options. On-device embedding retrieval remains a future enhancement.
