---
"inquiso": patch
---

Generate the extension's icon set from the logo. Wire @wxt-dev/auto-icons to
rasterize src/assets/logo.svg into the 16/32/48/128 PNGs the manifest needs, for
both Chrome and Firefox builds. Also set the toolbar button's `action.default_icon`
(auto-icons only fills the top-level `icons`) and keep the dev icon full-colour,
so the toolbar, extensions page, and store listing all show the Inquiso mark
instead of a default placeholder.
