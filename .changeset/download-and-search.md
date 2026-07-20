---
"inquiso": minor
---

Add file downloads and provider-native web search. `downloadFile` saves a
file (PDF, image, media) from a page URL to the user's downloads (gated — the
user approves the URL; the browser fetches it, no page data sent). Web search
is offered as a capability, not a raw-fetch tool: when the active provider
supports it (OpenAI/Anthropic/Google) and the "Allow web search" setting is on
(default), the provider's own search tool is merged into the tool set and its
calls show in the Thoughts trace. The query egresses to the provider, so it's
a toggle and flagged in Settings and docs/05. Chrome AI, WebLLM, and custom
gateways don't advertise native search.
