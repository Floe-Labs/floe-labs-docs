---
icon: store
---

# Marketplace Shim

The **marketplace shim** lets Floe list vendors that don't speak x402 natively — like [Deepgram](../x402-directory/voice.md#deepgram-speech-to-text) and [HydraDB](../x402-directory/database.md) — and have agents consume them exactly like every other storefront vendor. It re-exposes those vendors as plain Floe endpoints under one host:

```text
Host:  https://marketplace.floelabs.xyz
```

You never call that host directly. You call it **through Floe's proxy**, just like any x402 API in the [vendor marketplace](../x402-directory/README.md). The shim handles talking to the upstream vendor and reports the cost back to Floe so it can be billed from your credit line.

## Why it exists

Most vendors in the directory expose their own x402 endpoint — they return a `402 PAYMENT-REQUIRED`, and the [facilitator](x402-facilitator.md) settles USDC on Base. Some valuable vendors don't have an x402 surface at all. Rather than make agents integrate each one with bespoke auth and billing, Floe runs a thin shim that:

- Re-exposes each non-x402 vendor as a stable Floe route (e.g. `POST /v1/stt/deepgram`, `POST /v1/db/hydradb/query`).
- Holds the upstream vendor credentials so you don't need a vendor account or key.
- **Meters every request** and reports the cost to Floe, which debits your credit line — the same prepaid balance you use for x402 APIs.

The result: shim-backed vendors are consumed **uniformly** with everything else. Same Floe key, same proxy call, same credit line.

## How you call it

Wrap the marketplace route in the standard proxy envelope — a Floe key plus an inner `{ url, method, headers, body }` whose `url` is the marketplace route:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://marketplace.floelabs.xyz/<vendor-route>", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": "<json string>"}'
```

There's nothing shim-specific in the call. If you can call an x402 vendor through `/v1/proxy/fetch`, you can call a shim-backed vendor — only the inner `url` changes.

## Billing

Shim-backed vendors bill the **same way** as the rest of the marketplace: one Floe key, one credit line, paid through the proxy. The difference is where the price comes from.

| | x402 vendor | Marketplace shim vendor |
|---|---|---|
| Price source | Vendor's `402 PAYMENT-REQUIRED` response | The shim meters the request itself |
| Settlement | Facilitator signs USDC on Base | Floe debits your credit line at the metered cost |
| Pricing model | Per the vendor | Metered per character / audio second / audio minute (see route table below); HydraDB is free |
| Your key | Floe key | Floe key |

You're charged the exact metered amount per request, deducted from the same prepaid balance governed by your [spend controls](spend-controls.md).

## Per-payer tenant isolation (HydraDB)

For stateful vendors like HydraDB, the shim enforces **hard isolation between payers**. It derives a `tenant_id` from your Floe identity and **forces it on every upstream request** — you never set it, and you can't read or write another payer's data. Two agents calling the same HydraDB routes see entirely separate datasets.

Inside your own tenant you still control namespacing: every HydraDB route accepts an optional `subTenantId`, and the tenant-management routes (`tenant/create`, `tenant/status`, `tenant/delete`) operate within the boundary the shim already enforces. See the [Memory](../x402-directory/database.md) directory page for the full route list and request shapes — all HydraDB routes are free to call.

## Available shim vendors

All routes are `POST`, called through `/v1/proxy/fetch` as above. Prices are the vendor's list rate, before Floe's 5% margin — you're billed the metered amount.

| Vendor | Routes | Price (vendor list) | Directory page |
|---|---|---|---|
| Deepgram | `/v1/stt/deepgram` · `/v1/tts/deepgram` | STT $0.0077/min · TTS $0.030/1K chars (Aura-2) | [Voice](../x402-directory/voice.md#deepgram-speech-to-text) |
| ElevenLabs | `/v1/tts/elevenlabs` · `/v1/stt/elevenlabs` | TTS $0.05/1K chars (`eleven_flash_v2_5`; v3 $0.10/1K) · STT $0.22/hr (Scribe v2) | [Voice](../x402-directory/voice.md#elevenlabs-text-to-speech) |
| Cartesia | `/v1/tts/cartesia` · `/v1/stt/cartesia` | TTS metered/char (Sonic-3) · STT ~$0.135/hr (Ink-Whisper) | [Voice](../x402-directory/voice.md#cartesia-text-to-speech) |
| Google Cloud TTS | `/v1/tts/google` | $30/1M chars (Chirp 3 HD) | [Voice](../x402-directory/voice.md#google-cloud-text-to-speech) |
| AssemblyAI | `/v1/stt/assemblyai` | $0.21/hr (Universal-3.5) | [Voice](../x402-directory/voice.md#assemblyai-speech-to-text) |
| Sarvam AI | `/v1/tts/sarvam` · `/v1/stt/sarvam` · `/v1/stt-translate/sarvam` | TTS ~$0.36/10k chars · STT ~$0.36/hr | [Voice](../x402-directory/voice.md#sarvam-ai-text-to-speech) |
| Hume AI | `/v1/tts/hume` | ~$0.15/1K chars (Octave 2) | [Voice](../x402-directory/voice.md#hume-ai-text-to-speech) |
| Rime | `/v1/tts/rime` | $0.05/1K chars (coda) | [Voice](../x402-directory/voice.md#rime-text-to-speech) |
| Inworld AI | `/v1/tts/inworld` | $25/1M chars (inworld-tts-2) | [Voice](../x402-directory/voice.md#inworld-ai-text-to-speech) |
| MiniMax | `/v1/tts/minimax` | $60/1M chars (speech-2.8-turbo; HD $100/1M) | [Voice](../x402-directory/voice.md#minimax-text-to-speech) |
| Azure AI Speech | `/v1/tts/azure` · `/v1/stt/azure` | TTS $15/1M chars (neural) · STT $0.36/hr (fast transcription) | [Voice](../x402-directory/voice.md#azure-ai-speech-text-to-speech) |
| Amazon Polly | `/v1/tts/polly` | $16/1M chars (neural; standard $4/1M, generative $30/1M) | [Voice](../x402-directory/voice.md#amazon-polly-text-to-speech) |
| xAI | `/v1/tts/xai` · `/v1/stt/xai` | TTS $15/1M chars · STT $0.10/hr | [Voice](../x402-directory/voice.md#xai-text-to-speech) |
| Speechmatics | `/v1/stt/speechmatics` | $0.24/hr (melia-1) | [Voice](../x402-directory/voice.md#speechmatics-speech-to-text) |
| HydraDB | `/v1/db/hydradb/{query,ingest,status,list,delete,tenant/create,tenant/status,tenant/delete}` | free | [Memory](../x402-directory/database.md) |
