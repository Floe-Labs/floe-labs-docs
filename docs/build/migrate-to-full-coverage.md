# Graduate to 100% coverage — orchestrator → Pipecat/LiveKit on Floe

On Vapi or Retell, Floe governs what their platforms let it touch: the LLM leg
pre-call, everything else by [post-call reconcile](voice-orchestrators.md).
That's real governance — and it has a ceiling. The ceiling disappears when the
agent runs on an **open voice stack** (Pipecat / LiveKit) with every leg on
Floe rails: 100% of spend cap-enforced — request legs gated pre-call,
duration-billed legs (streaming STT, phone) metered live and cut off
mid-stream at the cap — one key, one ledger, one cap.

> **The honest comparison.** On an orchestrator, Floe-alone on the LLM leg is
> ~a token router with a budget. The answer isn't to pretend otherwise — it's
> this page: the path to 100%, which no token router can offer.

## Leg-by-leg migration

| Leg | On the orchestrator | On Floe rails |
|---|---|---|
| **LLM** | custom-llm → Floe (already pre-call) | Same endpoint: `https://credit-api.floelabs.xyz/v1` — nothing to change |
| **STT** | platform's vendor, reconciled | Streaming WS `wss://credit-api.floelabs.xyz/v1/audio/transcriptions/stream?model=deepgram/nova-3&encoding=linear16&sample_rate=16000&language=en` — binary PCM in, interim/final transcripts out, metered per audio-second |
| **TTS** | platform's vendor, reconciled | `POST /v1/audio/speech` (OpenAI-compatible; e.g. `openai/tts-1`) — metered per character |
| **Telephony** | platform's carrier, reconciled | [Floe Phone](../developers/floe-phone.md): `POST /v1/developer/agents/{agentId}/numbers` + `POST /v1/calls`, metered per minute |

### Pipecat — three drop-in services

The [`pipecat-floe`](https://github.com/Floe-Labs/pipecat-floe) package is the
fastest path (`pip install pipecat-floe`):

```python
from pipecat_floe import FloeSTTService, FloeLLMService, FloeTTSService

stt = FloeSTTService()                              # streaming STT over Floe's WS
llm = FloeLLMService(model="openai/gpt-4o-mini")    # OpenAI-compatible
tts = FloeTTSService(model="openai/tts-1", voice="alloy")
```

One `FLOE_API_KEY` — a `floe_…` **agent** key, not a `floe_live_…` developer
key — powers all three; a single session cap bounds the whole run. Working references: the
[livekit-voice-agent](https://github.com/Floe-Labs/floe-cookbook/tree/main/livekit-voice-agent)
recipe (LLM + TTS swaps, STT note) and
[floe-phone-sales-agent](https://github.com/Floe-Labs/floe-cookbook/tree/main/floe-phone-sales-agent)
(every leg incl. telephony — the full dogfood).

## Coverage & cost calculator

Illustrative 3-minute outbound call, typical talk ratio (~40% caller / ~60%
agent speech, ~1.5k LLM tokens/turn × 12 turns). Recompute for your profile
with `POST /v1/estimate` — rates move; the *structure* is the point.

| | Orchestrator + Floe LLM | Full path on Floe |
|---|---|---|
| LLM (gpt-4o-mini class) | ~$0.008 — **pre-call ✓** | ~$0.008 — pre-call ✓ |
| STT | platform rate, reconciled ⟳ | ~$0.010 (1.2 caller min × $0.0077 × 1.05) — pre-call ✓ |
| TTS | platform rate, reconciled ⟳ | ~$0.011 (tts-1 @ $15/1M chars, ~700 chars) — pre-call ✓ |
| Telephony | platform rate, reconciled ⟳ | ~$0.042 (Floe Phone outbound @ $0.014/min) — pre-call ✓ |
| Platform fee | e.g. Vapi $0.05/min → $0.15 | $0 (Floe margin is inside the leg rates above) |
| **Pre-call coverage** | **~10–60%** (the LLM share) | **100%** |
| **Governance at the cap** | LLM refused; other legs die *next* call | Every leg refused *this* call |

Two honest caveats: orchestrator bundles include their platform value
(builder UX, tooling) that raw legs don't replicate; and per-leg rates drift —
trust `POST /v1/estimate` and the [pricing page](../getting-started/pricing.md)
over this table.

## Sequence it

1. **Today**: point the orchestrator's LLM at Floe + connect
   [Reconcile Mode](voice-orchestrators.md) — full visibility, LLM pre-call.
2. **Watch the coverage score** (dashboard, per agent): it names the
   reconciled legs and what moving each one is worth.
3. **Migrate legs when ready** — STT and TTS are one-service swaps in
   Pipecat/LiveKit; telephony last (number porting is the sticky part).
