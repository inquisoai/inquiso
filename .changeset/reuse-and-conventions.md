---
'inquiso': patch
---

Reuse and convention pass from a full-codebase audit:

- One source of truth for the GitHub sync origin, the label slug shared by provider/MCP ids, the localforage database name, base64 helpers, the browser permission check/grant flow, and web-tab filtering.
- Stored settings are now Zod-validated on every read; corrupt fields degrade to defaults individually.
- Tool descriptions state their confirmation gate consistently; the screenshot tool returns raw data like every other read tool.
- New shared UI kit (TextField, Button, DashedCard, SettingRow, IconButton, Menu split with `selected`/`MenuDivider`) replaces copy-pasted class strings and form flows; connect-form failures now surface an error in all four settings forms.
- Remaining hardcoded strings routed through i18n (autonomy labels, trace units); new danger/warn theme tokens replace raw red/amber shades so status colors adapt to dark mode.
