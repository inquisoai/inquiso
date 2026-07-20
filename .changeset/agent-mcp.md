---
"inquiso": minor
---

MCP (Model Context Protocol) support. Connect your own MCP servers in Settings
and the agent can call their tools alongside its built-in ones — turning Inquiso
into an extensible platform, not a fixed tool set. Servers connect over HTTP
(the background worker has no EventSource for SSE); their tools are namespaced
per server and routed through the same confirmation gate as native tools
(treated as medium-risk external actions). Any bearer token is stored encrypted
in the background and never synced or exposed to the UI; the server's origin is
granted via the standard per-host consent prompt. Connections are torn down when
the run ends.
