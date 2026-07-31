---
icon: microphone
---

# Voice dictation with Earheart

[Earheart](https://github.com/cleanunicorn/earheart) is an open-source (MIT)
desktop app by [cleanunicorn](https://github.com/cleanunicorn) for dictating
prompts into AI coding agents: press a hotkey, speak, press again, and the
transcript is pasted into Claude Code, Codex, or Cursor. It ships with
on-device engines — NVIDIA Parakeet for speech-to-text and Gemma for
transcript cleanup — and both engines can instead point at any
OpenAI-compatible endpoint.

Floe's gateway serves exactly those two surfaces, so Earheart runs end-to-end
on **one Floe key** with a single server-side spend cap: batch STT on
[`POST /v1/audio/transcriptions`](../developers/keyless-inference.md#speech-to-text)
(including hosted `nvidia/parakeet-tdt-0.6b-v3` — the same model Earheart runs
locally, minus the ~2.4 GB download) and cleanup on `POST /v1/chat/completions`.

This is the voice front door to the workflow on
[Set up with your AI tools](setup-with-ai-tools.md): Earheart gets your words
into Claude Code, and the [Floe MCP server](../developers/mcp-server.md)
gives Claude Code the tools to act on them.

## 1. Install Earheart

Grab the installer for Windows, macOS (Apple Silicon or Intel), or Linux from
the [releases page](https://github.com/cleanunicorn/earheart/releases). The
default hotkey is `Ctrl/Cmd+Shift+Space`. Out of the box everything runs
on-device — no keys, no network.

## 2. Point the engines at Floe (optional)

Each engine is switched independently in Earheart's settings — move one leg
to Floe and keep the other local if you prefer. Both use base URL
`https://credit-api.floelabs.xyz/v1` and your `floe_*` agent key:

- **Settings → Speech-to-text** — model `nvidia/parakeet-tdt-0.6b-v3` (any id
  from the [batch STT catalog](../developers/keyless-inference.md#speech-to-text)
  works; ids are fully qualified as `provider/model`).
- **Settings → Cleanup** — model `google/gemma-3-12b` (same family as
  Earheart's local default) or `openai/gpt-4o-mini`.

Transcription meters per audio second, cleanup per token — separate line
items on the same [unified ledger](../build/unified-ledger.md), governed by
one [session spend limit](../developers/spend-controls.md).

Exact settings values and shell-level verification commands live in the
cookbook: [earheart-voice-dictation](https://github.com/Floe-Labs/floe-cookbook/tree/main/earheart-voice-dictation).

## 3. Dictate into Claude Code

With the [Floe MCP server connected](setup-with-ai-tools.md#3-connect-a-client),
focus Claude Code, press the hotkey, and speak:

> "Check my agent's remaining credit, then estimate the cost of calling the
> Exa contents endpoint five times."

Earheart transcribes, cleans, and pastes; Claude Code answers with
`get_credit_remaining` and `x402_forecast`. Add technical terms Earheart
mishears — `x402`, `Floe`, model ids — to its personal dictionary
(Settings → Dictionary).

## Next steps

- [Set up with your AI tools](setup-with-ai-tools.md) — one prompt wires Floe into your coding agent
- [Floe Inference](../developers/keyless-inference.md) — the endpoints and model catalog behind both legs
- [Spend Controls](../developers/spend-controls.md) — the caps to set before metering anything
