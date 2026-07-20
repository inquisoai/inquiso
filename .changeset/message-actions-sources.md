---
"inquiso": minor
---

Answer actions + web-search sources. Completed answers now have a Copy button
(copies the markdown, with a brief "copied" tick) alongside the existing
read-aloud control, and — when the model grounded its answer with provider web
search — a collapsible "Sources" pill listing the cited pages, each opening in a
new tab. Sources are captured from the AI SDK stream and shown in-session
(consistent with local-first, not persisted). Thumbs up/down were intentionally
left out: Inquiso is serverless with no telemetry, so a rating would have
nowhere to go.
