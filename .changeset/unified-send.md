---
"inquiso": minor
---

One unified conversation, ChatGPT-style. The Chat/Agent tabs, Ask/Summarize/
Trust-check buttons, and observe-only toggle are gone: a single composer sends
every message through one path, where the model receives the scoped, reranked
page context up front and — when the provider supports tool-calling — the page
tools, deciding for itself whether to answer, summarize, or act. Action tools
remain individually confirmation-gated (the risk gate is unchanged); providers
without tool-calling (Gemini Nano) fall back to plain grounded chat. Also adds
the new landing empty state (greeting, suggestion chips, local-first privacy
note), Enter-to-send, and a Gemini-style "+" composer menu that owns the
shared-context scope (attachments will land there too).
