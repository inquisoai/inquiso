---
"inquiso": minor
---

A readable page is no longer required to send. Inquiso is a browser-wide agent,
so a turn shouldn't die with "No readable pages in scope." just because the
current tab is blank, restricted, or not yet granted. The page is now treated as
optional grounding: when one is readable it's read and used as before, but on a
blank/restricted tab the agent still runs — it can answer from knowledge, open a
site the user names in a new tab, navigate, search history, or use any tool. The
only hard precondition is that the selected model is available. The agent system
prompt was updated to describe the full browser-wide capability and the
no-page-present case.
