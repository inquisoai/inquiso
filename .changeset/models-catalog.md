---
"inquiso": minor
---

Keep model lists current from models.dev. The per-provider model pickers were
hardcoded and had gone stale (GPT-4o, Claude 3.5, Gemini 2.x). They now
overlay the live [models.dev](https://models.dev) catalog — fetched in the
background, cached 7 days, filtered to tool-capable text models newest-first —
so new models appear without a release. The built-in lists were refreshed to
today's models (GPT-5.x, Claude 5 / Opus 4.8, Gemini 3.x) and serve as the
offline fallback; both the picker and request resolution read the same source
so the shown default always matches what's sent.
