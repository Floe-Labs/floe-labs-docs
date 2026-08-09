# Unified Billing & Ledger

A token router shows you your LLM spend. Floe shows you the whole bill — telephony, speech, search, compute, and LLM — in one ledger, priced per call, capped by one policy set.

## Why this exists

A voice agent's cost is never just tokens. One conversation pays for telephony to place the call, speech-to-text to hear the caller, an LLM to decide what to say, and text-to-speech to say it back. If four vendors bill four different ways, you can't answer the only question that matters: what did this call cost, and was it worth it?

Floe answers it. Every paid leg — x402 vendors and LLM alike — settles from the same balance and lands in the same ledger, tagged by agent, task, and vendor. x402 vendors go through `POST /v1/proxy/fetch`; LLM calls go through Floe's OpenAI-compatible gateway — **keyless** `POST /v1/chat/completions` (recommended; fully-qualified `provider/model` ids) or the **BYOK metered proxy** `POST /v1/llm/chat/completions` (your own provider key; model id with or without a `provider/` prefix). One balance, one ledger, one policy set.

## Route your LLM through Floe (BYOK metered proxy)

`POST /v1/llm/chat/completions` is Floe's **BYOK metered proxy**: you bring your own upstream provider key and Floe charges only a small routing fee on top of provider cost. It is OpenAI-compatible — same request shape as OpenAI Chat Completions — but distinct from the keyless gateway in two ways: it prices from Floe's maintained LiteLLM cost map and accepts the model id **with or without** a `provider/` prefix (`gpt-4o` or `openai/gpt-4o` — Floe strips it), and it needs your provider key. Point it at Floe's host, authenticate with your Floe agent key, and send your upstream provider key in the `X-Floe-Provider-Key` header — **required on this endpoint** (used only to call upstream, then discarded, never persisted). To skip the header, store the key once (encrypted, per provider) and use the **keyless `/v1` gateway** instead — stored-key auto-routing works there, not on `/v1/llm`. See [per-request vs stored keys](../developers/keyless-inference.md) for the storage flow and the fixed BYOK service fee.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/llm/chat/completions \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "X-Floe-Provider-Key: $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{ "role": "user", "content": "Hello from Floe" }]
  }'
```

> **Don't want to hold a provider key at all?** Use the **keyless** gateway `POST /v1/chat/completions` with a **fully-qualified** `provider/model` id (`openai/gpt-4o`) — Floe fronts the upstream relationship and bills you per call. That's the recommended path for new work; see [Floe Inference (Keyless LLM & Voice)](../developers/keyless-inference.md).

Now LLM tokens, speech, and search all count against the same budgets, appear in the same analytics, and feed the same per-agent cost history — right next to the x402 vendors you already pay through the proxy.

## One task, one budget, every vendor

Tag every leg of a job with the `X-Floe-Task-Id` header — on the proxy call and on the LLM call. The task budget then caps the **sum** across all vendors — telephony + STT + LLM + TTS — not each vendor in isolation.

```bash
-H "X-Floe-Task-Id: call-8842"
```

A $0.50 cap on `call-8842` is a ceiling for the whole conversation, no matter how the cost splits across the four vendors that served it. See [Spend Controls](../developers/spend-controls.md) for policy types and windows.

## Keyless inference

You can go one step further and drop the vendor accounts entirely. With keyless inference, you call LLM and voice models with no vendor account at all — Floe holds the upstream relationship and bills you per call from the same balance. Same ledger, same tags, one fewer key to manage.

See [Floe Inference (Keyless LLM & Voice)](../developers/keyless-inference.md).

## Next

Put the ledger to work behind a real voice agent — telephony, STT, LLM, and TTS on one bill: [The Voice Stack](voice-stack.md).
