---
"inquiso": minor
---

Voice: talk to Inquiso and have it talk back. A mic button in the composer
records a clip and transcribes it into the prompt (speech-to-text), and a
speaker button on each answer reads it aloud (text-to-speech). Voice is
BYOK-gated and independent of the selected chat model — it uses the first
configured provider that supports it (e.g. OpenAI Whisper / TTS), so it works
whenever you have a key for one, and the controls hide when none is available.
Recording happens in the sidebar (mic prompt); transcription and synthesis run
in the background with your key, never leaving the device beyond the provider.
