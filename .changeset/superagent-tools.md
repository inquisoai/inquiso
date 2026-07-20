---
"inquiso": minor
---

Expand the agent into a real "do things on my behalf" superagent — every new
capability is a registry file, and every state-changing one is confirmation-
gated. Read tools: getSelection, listLinks, readTables (structured extraction),
getMetadata, getTabs + readTab (cross-tab research), and on-device
remember/recall notes. Action tools (gated): navigate, waitFor, selectOption,
submitForm, highlight, and exportData (file downloads — adds the `downloads`
permission). New subagents: trust_auditor (our signature trust check) and
comparer (cross-tab side-by-side), alongside researcher. The content script
gained matching handlers (selection, links, tables, metadata, waitFor, select/
submit/highlight actions). Deferred pending a security/vision pass: screenshot
(image-in-loop) and web search (must be provider-native, not a raw fetch tool).
