---
"inquiso": minor
---

One-click site access. When the current page can't be read (no activeTab grant or host
permission), the panel now shows a live "Inquiso can't read <site> — Grant access" banner
above the composer instead of leaving the agent to apologize. The banner tracks the browser
in real time (tab switches, navigations, permission changes), granting is per-site and
least-privilege, blocked script injections surface as a stable `page_access_needed` code, and
the agent is instructed to point at the button and wait rather than dead-end.
