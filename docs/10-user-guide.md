# 10 — User Guide

How to install and use Inquiso. No account is ever required and nothing is sent to an Inquiso
server — you bring your own model, and your data stays on your device (or goes only to the AI
provider and cloud you choose).

There is **no store listing yet**, so today you install from source. It takes a few minutes.

## 1. Install from source

You need [Node.js](https://nodejs.org) 20+ and [pnpm](https://pnpm.io) (`npm i -g pnpm`).

```bash
git clone https://github.com/<owner>/inquiso.git
cd inquiso
pnpm install
pnpm build            # builds Chrome + Firefox into .output/
```

**Chrome / Edge / Brave (Chromium):**
1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select the `.output/chrome-mv3` folder.
4. Pin Inquiso and click its toolbar icon to open the sidebar.

**Firefox:**
1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and select `.output/firefox-mv2/manifest.json`.
   (Temporary add-ons are removed when Firefox restarts; reload after each restart.)

**Developing?** Run `pnpm dev` (Chrome) or `pnpm dev:firefox` for hot-reload instead of
`pnpm build`. See [CONTRIBUTING.md](../CONTRIBUTING.md).

## 2. Pick a model

Open the sidebar → the settings icon → **Models** tab.

- **Chrome Built-in AI (Gemini Nano)** — free, on-device, no key. The default; may need a
  one-time model download the first time.
- **Bring your own key (BYOK)** — pick OpenAI, Anthropic, or Google, then paste an API key:
  - OpenAI: <https://platform.openai.com/api-keys>
  - Anthropic: <https://console.anthropic.com/settings/keys>
  - Google AI Studio: <https://aistudio.google.com/apikey>
  Keys are stored **encrypted on your device** and sent only to that provider's official
  endpoint — never to us, never synced.
- **Any OpenAI-compatible endpoint** — gateways (OpenRouter…), your own server, or a local
  model (Ollama, LM Studio) via **Add a provider**. Local URLs need no key; remote ones ask
  you to grant access to that host.

## 3. Ask and act

Type in the sidebar and press Enter. Inquiso reads the current page and answers, quoting the
page so you can verify. Use the **+** button to choose what it sees — **this page**, the **tab
group**, or **all tabs** in the window — or to attach files. If the model used web search,
a **Sources** chip lists the pages it cited.

It's also an **agent**: ask it to *do* things — "open example.com in a new tab", "find the
cheapest option and add it to the cart", "summarize every open tab". You watch each reasoning
step and tool call live.

### Autonomy (how hands-off it is)

The control next to **+** sets this per message (default from Settings → Agent):

| Level | Behavior |
| --- | --- |
| **Ask** | Confirm every action. |
| **Auto** | Auto-run low-risk actions; confirm the rest. |
| **Autopilot** (default) | Run low/medium actions; **only high-risk actions confirm**. |

**High-risk actions always ask, at every level** — submitting forms, downloads, closing a
window, navigating to a different site. Inquiso can't be talked out of that confirmation.

### Granting extra access (Settings → Access)

Reading and acting on the current page works out of the box. Capabilities beyond that are **off
until you grant them**:

- **Bookmarks, History, Tab groups, Reopen closed tabs** — toggle on the ones you want.
- **All sites** — off by default. Turn on only if you want multi-site tasks to skip the
  per-site prompt. Revocable anytime.

## 4. Attach files

Click **+** → **Attach files** (or the paperclip). Images, PDFs, and text are supported;
image understanding needs a vision-capable model. Attachments are kept **on your device** so
they still show when you reopen a past chat; they're never uploaded to Inquiso or synced, and
you can wipe them anytime via **Settings → Agent → Stored attachments → Clear**.

## 5. Voice (optional)

With an OpenAI key connected, a **mic** button appears in the composer: tap it, speak, tap
again, and your words drop into the box (Whisper transcription). Each answer gets a **speaker**
button to read it aloud. Recording happens in the sidebar (your browser asks for mic
permission the first time); transcription/synthesis use your key.

## 6. Connect MCP tools (optional)

Settings → **MCP** lets you connect [Model Context Protocol](https://modelcontextprotocol.io)
servers so the agent can use their tools:

1. Enter the server's **name** and **URL** (HTTP transport), and a **bearer token** if it
   needs one.
2. Click **Add & grant access** — you'll be asked to allow the server's origin.

Its tools appear to the agent, namespaced per server, and pass through the same confirmation
gate as built-in actions. Tokens are stored encrypted on your device.

## 7. Move or back up your chats

### Export / import (any browser, no account)

History menu (clock icon) → **Export chats** downloads a JSON file of every conversation.
On another browser/profile, **Import chats** loads it back. Import never overwrites — imported
chats are added alongside what you have.

### Cloud backup (your own storage)

Settings → **Backup**. Data goes straight from the extension to **your** storage — there is no
Inquiso server involved. Choose **Manual** (default) or **Automatic** backup (pushes on a
schedule; restore is always manual), pick a provider, and connect it. Then **Back up now** /
**Restore** anytime — restore merges, it never overwrites.

Both providers need only a credential you paste — there's no app to register:

**GitHub Gist** *(easiest — a single private gist holds the backup)*
1. At <https://github.com/settings/tokens> create a token with the **`gist`** scope.
2. In **Provider → GitHub Gist**, paste it into **Personal access token** and click **Connect**.

**WebDAV** *(Nextcloud, ownCloud, or any WebDAV host)*
- **File URL** — the full path to the backup file, e.g.
  `https://cloud.example.com/remote.php/dav/files/you/inquiso.json`
- **Username** and an **app password** (in Nextcloud: *Settings → Security → Create new app
  password*).
- Click **Connect & grant access**.

The token/password is stored **encrypted on your device** and sent only to GitHub / your
server. (Google Drive and Dropbox would need an OAuth app registration, so they're not
included — the two options above need none.)

## Privacy in one line

Everything runs in your browser. Your keys and cloud credentials are encrypted locally and go
only to the provider/cloud you chose. Inquiso has no backend, no telemetry, and no account.
See [Security](05-security.md).
