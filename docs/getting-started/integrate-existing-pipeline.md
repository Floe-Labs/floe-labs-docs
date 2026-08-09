---
icon: plug
---

# Add Floe to your existing voice pipeline

You already have a working voice agent — STT → LLM → TTS, on Vapi, Retell, Pipecat, LiveKit, or your own loop. **You don't need to rebuild it.** Route the calls you already make through Floe to get one key, spend limits, and a per-call cost breakdown — without changing your agent's logic.

Pick how much you want on one ledger:

| | What changes | You get |
|---|---|---|
| **Option A — route the LLM only** | One line (base URL + key) | LLM spend on one key, capped, itemized. Keep Deepgram/ElevenLabs untouched. |
| **Option B — route every leg** | Wrap each vendor call | STT + LLM + TTS on **one bill, one task budget** |

---

## Option A — route just the LLM (one line)

Floe's LLM endpoint is **OpenAI-compatible**, so it's a `base_url` + key swap. Keyless means Floe holds the upstream model key — you send only your Floe key.

{% tabs %}
{% tab title="Python" %}
```python
from openai import OpenAI

# Before:
# client = OpenAI(api_key=OPENAI_API_KEY)

# After:
client = OpenAI(
    api_key=FLOE_API_KEY,
    base_url="https://credit-api.floelabs.xyz/v1",
)
resp = client.chat.completions.create(
    model="openai/gpt-4o",          # Floe routes to the provider — no provider key
    messages=[{"role": "user", "content": "..."}],
)
```
{% endtab %}
{% tab title="TypeScript" %}
```typescript
import OpenAI from "openai";

// Before: new OpenAI({ apiKey: OPENAI_API_KEY })
const client = new OpenAI({
  apiKey: process.env.FLOE_API_KEY,
  baseURL: "https://credit-api.floelabs.xyz/v1",
});
const resp = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "..." }],
});
```
{% endtab %}
{% tab title="curl" %}
```bash
curl -X POST https://credit-api.floelabs.xyz/v1/chat/completions \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o","messages":[{"role":"user","content":"..."}]}'
```
{% endtab %}
{% endtabs %}

> **Shortcut:** `npx @floelabs/cli init` mints the key into your OS keychain and ends by printing exactly this base-URL swap, key filled in. See [Floe CLI](../developers/cli.md).

That's it — the LLM leg is now on your Floe balance, under your [spend controls](../developers/spend-controls.md), and every response returns its cost in `X-Floe-Payment-Amount` (see [Pricing](pricing.md)).

**Keep your own model key?** Point at the BYOK metered proxy `/v1/llm/chat/completions` (bare model ids there, e.g. `gpt-4o`) and add `X-Floe-Provider-Key: <your OpenAI/Anthropic key>` — Floe meters the call and charges only a routing fee; you pay the vendor at cost. See [Floe Inference](../developers/keyless-inference.md).

---

## Option B — route every leg (STT + LLM + TTS on one bill)

Send your STT and TTS calls through Floe's proxy too. Same request you make today, wrapped in `POST /v1/proxy/fetch` with your Floe key — Floe pays the vendor, so you don't manage a separate Deepgram/ElevenLabs key or balance.

```bash
# STT (Deepgram) — before: POST https://api.deepgram.com/v1/listen with your Deepgram key
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Floe-Task-Id: call-8842" \
  -d '{"url":"<DEEPGRAM_STT_ENDPOINT>","method":"POST","body":"{...audio...}"}'

# TTS (ElevenLabs) — same shape
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Floe-Task-Id: call-8842" \
  -d '{"url":"<ELEVENLABS_TTS_ENDPOINT>","method":"POST","body":"{...text...}"}'
```

Tag every leg with the same `X-Floe-Task-Id` and one task budget caps the **whole conversation** — STT + LLM + TTS together. See [The Voice Stack](../build/voice-stack.md) for the full costed turn.

---

## Framework one-liners

Most voice frameworks let you override the LLM base URL — that's all Option A needs:

| Framework | How |
|---|---|
| **Vapi** | Set a custom LLM provider with base URL `https://credit-api.floelabs.xyz/v1` and your Floe key |
| **Vercel AI SDK** | `createOpenAI({ baseURL: "https://credit-api.floelabs.xyz/v1", apiKey: FLOE_API_KEY })` |
| **Pipecat / LiveKit** | Point the LLM service's `base_url` at `https://credit-api.floelabs.xyz/v1`. See the live-voice note below for the TTS and STT legs. |
| **LangChain** | `ChatOpenAI(openai_api_base="https://credit-api.floelabs.xyz/v1", openai_api_key=FLOE_API_KEY)` |
| **Anything HTTP** | It's OpenAI-compatible — change the host and key |

### Live voice (Pipecat / LiveKit): which legs land on Floe

A **live** LiveKit/Pipecat pipeline streams audio and wires three separate services — STT, LLM, TTS. All three route through Floe keyless, on one ledger:

- **LLM** — keyless base-url swap above (`https://credit-api.floelabs.xyz/v1`). Metered on Floe.
- **TTS** — Floe keyless too: point the framework's TTS service at `POST /v1/audio/speech` (OpenAI-compatible), or wrap a vendor in `POST /v1/proxy/fetch`. Metered on Floe.
- **Live STT** — Floe keyless too: point the framework's STT service at the streaming WebSocket `wss://credit-api.floelabs.xyz/v1/audio/transcriptions/stream?model=deepgram/nova-3&encoding=linear16&sample_rate=16000&language=en` with your Floe agent key. Stream PCM frames up; Floe emits the `interim`/`final` transcript events the plugin expects. Metered per audio-second on Floe (Floe fronts the Deepgram key) — no BYO key.

For the full picture, see [The Voice Stack — live voice with your own stack](../build/voice-stack.md#live-voice-with-your-own-stack-livekit-pipecat).

---

## Next

- [Installation](installation.md) · [Authentication](authentication.md) · [Pricing & cost](pricing.md)
- [Spend Controls](../developers/spend-controls.md) — cap the pipeline you just connected
- [The Voice Stack](../build/voice-stack.md) — the full STT→LLM→TTS turn on one key
