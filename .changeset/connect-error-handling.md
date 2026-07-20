---
"inquiso": patch
---

Handle backup-connection failures gracefully. Connecting a GitHub Gist or WebDAV
endpoint with a bad token/credential used to throw an uncaught error ("handler_error")
with no feedback. Now the connect forms catch the failure and show a clear inline
message, the messaging router surfaces the real reason instead of a generic code,
and the optional voice-capability check can no longer raise an unhandled rejection.
