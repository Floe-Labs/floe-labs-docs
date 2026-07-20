---
icon: phone
---

# Floe Phone — Numbers & Voice for Agents

Give an agent a real US phone number in one API call. The number binds 1:1 to the agent, the monthly rental debits the agent's Floe balance, and every leg of a live voice call — carrier minutes, transcription, model tokens (hosted mode), speech synthesis — meters as separate line items on the same ledger, governed by the same spend controls as every other vendor.

No carrier account, no telephony credentials, no per-vendor billing. One Floe key, one balance, one set of caps.

When someone dials the agent's number, Floe answers into its media pipeline: caller audio is transcribed (Deepgram), the transcript runs through the agent's model via [keyless inference](keyless-inference.md) (hosted mode — in webhook mode your own backend supplies the reply instead), and the reply is spoken back (ElevenLabs) — all in real time, with barge-in support. Outbound works the same way via `POST /v1/calls`.

## Pricing

| Item | Price |
| --- | --- |
| US local number | **$1.21 / month** (charged at purchase, then monthly) |
| Inbound call transport | **$0.0089 / minute** |
| Outbound call transport | **$0.0147 / minute** |
| Live-call transcription (STT) | **~$0.0045 / minute** |
| Live-call speech (TTS) | **$0.0000525 / character** |
| Live-call model (LLM) | the model's own [keyless-inference rate](keyless-inference.md) — hosted mode only |

Prices are upstream cost plus Floe's standard 5% margin. The rental price is locked in when you buy the number; catalog price changes only affect future purchases. Each call produces itemized ledger rows (`phone://{number}/call/{callId}` for transport, `…/stt` and `…/tts` for the voice legs, plus — on hosted-mode calls — the model's own gateway rows; webhook mode uses your model, so no LLM leg is billed) — you can see exactly where a cent went.

**Runaway calls are cut off mid-flight.** An upper bound (default $2.00) is reserved when a call starts; spend is metered live during the call, and if the next turn wouldn't fit — or a [spend policy](spend-controls.md) or session cap would breach — Floe hangs up the call. A carrier-side usage trigger acts as an async backstop and suspends the account's phone service if carrier spend crosses its monthly threshold.

**No auto-recharge, by design.** If the agent balance can't cover a monthly renewal, the number enters a grace period (7 days) and keeps working; if the balance isn't funded by the end of it, the number is released.

## Authentication

All endpoints below use your **developer key** (`floe_live_…`) as a Bearer token — the same auth as the rest of the `/v1/developer` surface. Numbers are reached through the agent that owns them; a number under another developer's agent returns `404`.

```http
Authorization: Bearer floe_live_...
```

## Buy a number

One US local voice number per agent, bound at purchase, provisioned instantly. `areaCode` is optional — omit it for any available US number.

`POST /v1/developer/agents/{agentId}/numbers`

{% tabs %}
{% tab title="cURL" %}

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/agents/42/numbers \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"areaCode": "415"}'
```

{% endtab %}

{% tab title="TypeScript" %}

```ts
const res = await fetch('https://credit-api.floelabs.xyz/v1/developer/agents/42/numbers', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.FLOE_LIVE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ areaCode: '415' }),
});
const { number } = await res.json();
console.log(number.phoneNumber); // "+14155550123"
```

{% endtab %}

{% tab title="Python" %}

```python
import os, requests

res = requests.post(
    "https://credit-api.floelabs.xyz/v1/developer/agents/42/numbers",
    headers={"Authorization": f"Bearer {os.environ['FLOE_LIVE_KEY']}"},
    json={"areaCode": "415"},
)
print(res.json()["number"]["phoneNumber"])  # "+14155550123"
```

{% endtab %}
{% endtabs %}

**Response `201`:**

```json
{
  "number": {
    "id": 7,
    "phoneNumber": "+14155550123",
    "status": "active",
    "areaCode": "415",
    "monthlyRentalRaw": "1207500",
    "nextRenewalAt": "2026-08-20T18:00:00.000Z",
    "graceUntil": null,
    "releasedAt": null,
    "releaseReason": null,
    "createdAt": "2026-07-20T18:00:00.000Z"
  }
}
```

The first month's rental (`monthlyRentalRaw`, raw 6-decimal USDC — `1207500` = $1.2075) is debited from the agent balance at purchase and returned in the `X-Floe-Cost-USDC` response header. The debit appears on the ledger as `phone://{number}/rental`.

**Errors:** `402 insufficient_balance` (fund the agent first), `402 policy_exceeded` / `spend_limit_exceeded` (a spend policy blocked the debit), `409 number_exists` (the agent already has a number), `409 no_numbers_available` (try another area code), `409 agent_unavailable` (agent suspended or closed).

## List numbers

`GET /v1/developer/agents/{agentId}/numbers`

Returns all of the agent's numbers, newest first, **including released history**. `status` is one of:

* `active` — provisioned, rental current.
* `grace` — the last renewal debit failed; the number works until `graceUntil`, then it is released. Fund the agent balance to keep it.
* `released` — gone (developer release, non-payment, or agent winddown — see `releaseReason`). History rows are kept forever.

## Release a number

`DELETE /v1/developer/agents/{agentId}/numbers/{numberId}`

Irreversible — the number returns to the carrier pool and may be claimed by someone else. Call history and spend attribution are preserved. No refund for the current rental period. Releasing an already-released number is a no-op success.

```bash
curl -X DELETE https://credit-api.floelabs.xyz/v1/developer/agents/42/numbers/7 \
  -H "Authorization: Bearer $FLOE_LIVE_KEY"
```

## Call history

`GET /v1/developer/agents/{agentId}/numbers/{numberId}/calls`

Recent calls touching the number, most recent first:

```json
{
  "calls": [
    {
      "id": "CA9e…",
      "direction": "inbound",
      "from": "+14155559876",
      "to": "+14155550123",
      "status": "completed",
      "durationSeconds": 184,
      "startedAt": "2026-07-20T17:40:11Z",
      "endedAt": "2026-07-20T17:43:15Z"
    }
  ]
}
```

## Usage & spend

`GET /v1/developer/agents/{agentId}/numbers/{numberId}/usage?days=30`

Per-number spend time-series straight from the Floe ledger — rental debits plus every call's transport, STT, and TTS legs. `days` is 1–365, default 30. Amounts are raw 6-decimal USDC strings.

```json
{
  "number": { "id": 7, "phoneNumber": "+14155550123" },
  "days": 30,
  "totalRaw": "1207500",
  "daily": [
    { "day": "2026-07-20", "totalRaw": "1207500", "requests": 1 }
  ]
}
```

## Outbound calls

`POST /v1/calls` — authenticated with the **agent's** key (`floe_…`), so agents can place calls autonomously under their own spend controls. The agent's number is the caller ID; when the callee answers, the same voice pipeline runs.

{% tabs %}
{% tab title="cURL" %}

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/calls \
  -H "Authorization: Bearer $FLOE_AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"toNumber": "+14155559876"}'
```

{% endtab %}

{% tab title="TypeScript" %}

```ts
const res = await fetch('https://credit-api.floelabs.xyz/v1/calls', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.FLOE_AGENT_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ toNumber: '+14155559876' }),
});
const { callId } = await res.json();
```

{% endtab %}

{% tab title="Python" %}

```python
import os, requests

res = requests.post(
    "https://credit-api.floelabs.xyz/v1/calls",
    headers={"Authorization": f"Bearer {os.environ['FLOE_AGENT_KEY']}"},
    json={"toNumber": "+14155559876"},
)
print(res.json()["callId"])
```

{% endtab %}
{% endtabs %}

**Response `201`:** `{ "callId": "CA…", "from": "+14155550123", "to": "+14155559876", "status": "queued" }`. A call that's never answered costs nothing — billing starts when the media stream opens. There is also a dashboard-session variant, `POST /v1/developer/agents/{agentId}/numbers/{numberId}/test-call`, which powers the one-click "the agent calls you" test.

## Voice settings — hosted vs webhook

`GET | PATCH /v1/developer/agents/{agentId}/voice`

Two ways to run the conversation, switchable any time — the setting is read at call setup, so a PATCH applies to the next call with zero downtime:

* **`hosted`** (default) — Floe runs the model through [keyless inference](keyless-inference.md) using your `systemPrompt`. No server needed. The LLM leg bills per-token like any gateway call.
* **`webhook`** — Floe streams each finished caller utterance to your `webhookUrl` (`POST`, JSON: `{ type: "agent.message", channel: "voice", callId, text, recentHistory }`) and your backend replies with NDJSON text chunks: `{"text":"…","interim":true}` lines for progress, `{"text":"…"}` for what gets spoken. You bring your own model — no LLM leg is billed.

```bash
curl -X PATCH https://credit-api.floelabs.xyz/v1/developer/agents/42/voice \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"voiceMode": "hosted", "systemPrompt": "You are the support line for Acme.", "beginMessage": "Hi, this is Acme support!"}'
```

PATCH fields (all optional; empty string clears): `voiceMode`, `systemPrompt` (hosted), `beginMessage` (spoken on connect), `voice` (TTS voice id), `model` (gateway model slug, default `openai/gpt-5.4-mini`), `webhookUrl` (required for webhook mode, https only).

## Dashboard

Everything above is also in the [developer dashboard](developer-dashboard.md): open an agent and use the **Floe Phone** panel to buy a number by area code, switch voice modes, set the prompt and greeting, run a one-click test call, watch renewal state, and see per-call spend. The vendor card lives in the marketplace under **Telephony → Floe Phone**.
