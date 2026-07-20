---
"inquiso": minor
---

M3 — The transparent agent. Adds a tool-calling agent that reads and operates
the current page (readPage, queryElements, scrollTo, click, type) on the user's
behalf, streaming its reasoning and every action to the side panel as a live
trace. Elements are referenced by opaque handles (no eval / raw selectors).
A risk gate forces user confirmation for sensitive actions (click/type) in the
background regardless of model output; observe-only mode removes action tools;
an emergency stop aborts the run. Agent mode requires a cloud (tool-calling)
provider — Chrome AI stays available for chat.
