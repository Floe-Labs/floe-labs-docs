# The Voice Stack

One Floe key pays every leg of a voice conversation — telephony, speech-to-text, LLM, and text-to-speech — and every leg lands in one ledger with one set of budget caps.

## What one conversation costs

A single spoken turn touches four vendors. With Floe, all four bill to the same balance, and one task budget caps the whole turn. Costs below are illustrative.

| Leg | Vendor | Typical cost | Status |
|-----|--------|--------------|--------|
| Telephony | Twilio | ~$0.014 / min | Coming soon |
| Speech-to-Text | Deepgram | ~$0.007 / min | Live |
| Reasoning | LLM (any) | ~$0.020 / turn | Live |
| Text-to-Speech | ElevenLabs | ~$0.007 / turn | Live |
| **Total** | | **~$0.048** | |

## Run a full voice turn

Every leg carries the same `X-Floe-Task-Id: call-8842`, so one task budget covers the whole conversation. Each paid response returns the cost of that leg in `X-Floe-Payment-Amount`.

### 1. Transcribe (Deepgram, via the proxy)

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Floe-Task-Id: call-8842" \
  -d '{"url": "<DEEPGRAM_STT_ENDPOINT>", "method": "POST", "body": "{\"audioUrl\":\"https://example.com/turn.wav\"}"}'
```

### 2. Reason (LLM, OpenAI-compatible)

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/llm/chat/completions \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "X-Floe-Provider-Key: $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Floe-Task-Id: call-8842" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "Caller asked to reschedule to Friday. Confirm."}]}'
```

### 3. Speak (ElevenLabs, via the proxy)

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Floe-Task-Id: call-8842" \
  -d '{"url": "<ELEVENLABS_TTS_ENDPOINT>", "method": "POST", "body": "{\"text\":\"You are booked for Friday at 2pm.\"}"}'
```

All three legs share `X-Floe-Task-Id: call-8842`, so a single task budget caps the whole conversation — telephony, STT, LLM, and TTS together. A token router only sees step 2. Floe sees steps 1, 2, and 3 on one bill.

## Live voice vendors

| Service | Endpoints | Status |
|---------|-----------|--------|
| ElevenLabs | Text-to-Speech | Live |
| Deepgram | Speech-to-Text | Live |
| Venice AI | Text-to-Speech, Transcription | Live |
| Cartesia | Text-to-Speech | Live |
| Google Cloud TTS | Text-to-Speech | Live |
| AssemblyAI | Speech-to-Text | Live |
| Twilio | Telephony | Coming soon |

See the [Voice vendor directory](../x402-directory/voice.md) for endpoints, request shapes, and per-vendor pricing.

## One key, one ledger

Because the LLM leg routes through Floe's OpenAI-compatible endpoint, reasoning tokens land on the same ledger and the same budgets as the vendor legs — not a separate provider bill. See [Unified Billing & Ledger](unified-ledger.md) to read the combined statement, and [Spend Controls](../developers/spend-controls.md) to set the task, vendor, and session caps that govern every leg.
