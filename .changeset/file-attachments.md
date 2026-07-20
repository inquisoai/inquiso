---
"inquiso": minor
---

Attach files to a message. The composer's "+" menu now opens a file picker
(images, PDFs, text); attachments show as removable chips above the input and
are sent to the model as AI SDK file parts alongside the page context. The
option is gated to vision-capable providers — a new `files` capability flag
(OpenAI/Anthropic/Google/gateways yes; Chrome AI and WebLLM no) — so it's
disabled with an explanatory label otherwise. Attachments are capped (5 files,
10MB each), held in memory for the turn only, and never persisted.
