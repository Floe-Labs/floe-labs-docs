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
| US local number | **$2.00 / month** flat (charged at purchase, then monthly) |
| Inbound call transport | **$0.0089 / minute** |
| Outbound call transport | **$0.0147 / minute** |
| Live-call transcription (STT) | **~$0.0045 / minute** |
| Live-call speech (TTS) | **$0.0000525 / character** |
| Live-call model (LLM) | the model's own [keyless-inference rate](keyless-inference.md) — hosted mode only |

Usage prices are upstream cost plus Floe's standard 5% margin; the number rental is a flat monthly price. The rental price is locked in when you buy the number; catalog price changes only affect future purchases. Each call produces itemized ledger rows (`phone://{number}/call/{callId}` for transport, `…/stt` and `…/tts` for the voice legs, plus — on hosted-mode calls — the model's own gateway rows; webhook mode uses your model, so no LLM leg is billed) — you can see exactly where a cent went.

**Runaway calls are cut off mid-flight.** An upper bound (default $2.00, or the call's own `maxSpendRaw` if you set one — see [Per-call budgets](#per-call-budgets-attribution)) is reserved when a call starts; spend is metered live during the call, and if the next turn wouldn't fit — or a [spend policy](spend-controls.md) or session cap would breach — Floe hangs up the call. A carrier-side usage trigger acts as an async backstop and suspends the account's phone service if carrier spend crosses its monthly threshold.

**No auto-recharge, by design.** If the agent balance can't cover a monthly renewal, the number enters a grace period (7 days) and keeps working; if the balance isn't funded by the end of it, the number is released.

## Authentication

All endpoints below use your **developer key** (`floe_live_…`) as a Bearer token — the same auth as the rest of the `/v1/developer` surface. Numbers are reached through the agent that owns them; a number under another developer's agent returns `404`.

```http
Authorization: Bearer floe_live_...
```

## Buy a number

One US local voice number per agent, bound at purchase; provisioning starts immediately. `areaCode` (a 3-digit US area code, `2xx`–`9xx`) is **required** — the carrier picks a number within it. The only alternative is `phoneNumber`: an exact E.164 from a prior [search](#search-before-you-buy) (see-then-buy); if both are sent, `phoneNumber` wins. There is no "any US number" purchase — a request with neither is refused with `400 area_code_required` before anything is reserved or charged.

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
    "monthlyRentalRaw": "2000000",
    "nextRenewalAt": "2026-08-20T18:00:00.000Z",
    "graceUntil": null,
    "releasedAt": null,
    "releaseReason": null,
    "createdAt": "2026-07-20T18:00:00.000Z"
  }
}
```

The first month's rental (`monthlyRentalRaw`, raw 6-decimal USDC — `2000000` = $2.00) is debited from the agent balance at purchase and returned in the `X-Floe-Cost-USDC` response header. The debit appears on the ledger as `phone://{number}/rental`.

**Errors:** `400 area_code_required` (send `areaCode` or an exact `phoneNumber`), `400 invalid_area_code` (3 digits, `2xx`–`9xx`), `402 insufficient_balance` (fund the agent first), `402 policy_exceeded` / `spend_limit_exceeded` (a spend policy blocked the debit), `403 telephony_suspended` (phone service is suspended for this account — contact support), `409 number_exists` (the agent already has a number), `409 no_numbers_available` (nothing purchasable in that area code, or the exact number was taken — try another area code or search again), `409 agent_unavailable` / `agent_not_ready` (agent suspended/closed, or its wallet isn't provisioned yet), `502 provisioning_failed` (carrier-side failure — nothing was charged; retry or pick another area code), `503 telephony_unavailable` (Floe Phone isn't configured on this deployment — see the [error-code reference](../reference/error-codes.md#floe-phone-numbers)). Every error body carries a human-readable `detail` alongside the `error` code.

### Search before you buy

Preview purchasable numbers in an area code (free, no side effects), then buy an exact one by passing its `phoneNumber` to the endpoint above.

`GET /v1/developer/agents/{agentId}/numbers/search?areaCode=415`

```json
{
  "numbers": [
    { "phoneNumber": "+14155550123", "friendlyName": "(415) 555-0123", "locality": "San Francisco", "region": "CA" }
  ]
}
```

Search also accepts `areaCode` omitted (a broad US preview), but **buying** always needs either `areaCode` or an exact `phoneNumber`. Only numbers purchasable without an address on file are returned. Search does **not** reserve anything — another buyer can claim a number between your search and your purchase, in which case the buy returns `409 no_numbers_available`; search again and pick another.

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
  "totalRaw": "2000000",
  "daily": [
    { "day": "2026-07-20", "totalRaw": "2000000", "requests": 1 }
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

**Response `201`:** `{ "callId": "CA…", "from": "+14155550123", "to": "+14155559876", "status": "queued", "taskId": "ca…" }`. A call that's never answered costs nothing — billing starts when the media stream opens. There is also a dashboard-session variant, `POST /v1/developer/agents/{agentId}/numbers/{numberId}/test-call`, which powers the one-click "the agent calls you" test.

### Per-call budgets & attribution

Every call is a **task**. Each ledger row a call produces — transport, STT, TTS, and (hosted mode) the LLM leg — is stamped with one shared task id: the value of the `X-Floe-Task-Id` header if you sent one on `POST /v1/calls`, otherwise the lowercased `callId`. The id is echoed back as `taskId` in the `201` response. That means one query over the ledger by task id returns the *complete* itemized cost of one call — and if your webhook-mode backend tags its own LLM and tool calls with the same id (pass `X-Floe-Task-Id: <callId lowercased>` on its [keyless-inference](keyless-inference.md) and `/v1/proxy/fetch` calls), the brain's spend lands in the same rollup. One call, one task id, every leg.

Optional request extras on `POST /v1/calls`:

| Field | Where | What it does |
| --- | --- | --- |
| `X-Floe-Task-Id` | header | Task id stamped on every ledger leg of this call (≤128 chars, lowercased). Defaults to the lowercased call id. |
| `X-Floe-Customer-Id` | header | Opaque end-customer attribution (≤128 chars, lowercased) — lands on the same rows for the cross-source ledger. Falls back to the agent's `defaultCustomerId`, which is also what inbound calls attribute to. Under [strict attribution](../build/unified-ledger.md#attribute-spend-to-an-end-customer) a call that resolves neither is refused `400 customer_id_required` **pre-dial** — a call already in progress is never cut for a missing tag. |
| `maxSpendRaw` | body | Per-call reserve cap, raw 6-decimal USDC (e.g. `"500000"` = $0.50). Clamped to the platform per-call ceiling ($2.00 default), rejected with `400 max_spend_too_low` if it can't cover one minute of calling. |

To make a per-call budget *enforced* rather than just attributed, create a [task spend policy](spend-controls.md) whose `matchKey` is the task id — the reserve at answer, every hosted LLM turn, and any tool call tagged with that task id are then gated by it. The pre-dial check evaluates the task policy too, so an exhausted task budget denies with `403` *before* the callee's phone rings.

{% hint style="warning" %}
**The reserve counts against the task budget while the call is live.** Policy spend includes pending reservations, so the full per-call reserve (default $2.00, or your `maxSpendRaw`) is held against the task budget for the duration of the call and settles down to actual cost at hangup. Set the task policy's limit at or above the reserve — a task budget smaller than the reserve refuses the call at answer. In webhook mode, budget your backend's LLM/tool legs *on top of* the reserve if they share the task id.
{% endhint %}

## Call status & hangup

`GET /v1/calls/{callId}` — agent key. Poll a placed call's progress (dialers use this to detect call end):

```json
{ "callId": "CA…", "status": "in_progress", "terminal": false }
```

`status` is `pending` (queued / ringing / never answered), `in_progress` (live), `ending` (a hangup was issued and is being processed — transitions to a terminal status shortly), `completed`, or `failed`; `terminal` is `true` once the call can no longer change. Only the owning agent's calls are visible — anything else reads as `pending`.

`POST /v1/calls/{callId}/hangup` — agent key. End a live call (or cancel one that is still ringing) from outside the conversation:

```json
{ "callId": "CA…", "status": "ending" }
```

Returns `202` when the hangup was issued, or `200` with `"terminal": true` when the call had already ended (idempotent). This is the out-of-band control lever — a compliance system killing a call after an opt-out, or a dialer cancelling a runaway campaign. For ending a call *from within the conversation*, use the webhook `"end"` directive below.

### Pre-dial budget check

Before the call is placed, `POST /v1/calls` runs an admission check so an over-budget or suspended agent can't ring a callee's phone only to be cut off the moment the call connects. If the agent is suspended, or its balance can't cover roughly one minute of calling, or a spend policy blocks the call, the request is denied with **`403` before the call is placed** — you get no `callId` and the callee's phone never rings.

Deny reasons include `insufficient_balance` (top up the agent first), `policy_exceeded` (a spend policy blocks the call), and the suspended states `credit_frozen` / `credit_line_expired` (resolve billing or renew the credit line).

This is admission control at the *start* of the call, and it's deliberately conservative — the authoritative money gate is the reserve taken when the call is answered, so the pre-dial check rejects only clearly-unaffordable or blocked dials. It's distinct from **live metering**: once a call is answered, Floe meters it per second and ends it if continuing would breach the cap (see above). The pre-dial check just avoids ringing a callee for a call that can't run.

## Voice settings — hosted vs webhook

`GET | PATCH /v1/developer/agents/{agentId}/voice`

Two ways to run the conversation, switchable any time — the setting is read at call setup, so a PATCH applies to the next call with zero downtime:

* **`hosted`** (default) — Floe runs the model through [keyless inference](keyless-inference.md) using your `systemPrompt`. No server needed. The LLM leg bills per-token like any gateway call.
* **`webhook`** — Floe streams each finished caller utterance to your `webhookUrl` and your backend replies with NDJSON text chunks. You bring your own model — no LLM leg is billed.

### The webhook contract

Each finished caller utterance arrives as a `POST` to your `webhookUrl`:

```json
{
  "type": "agent.message",
  "channel": "voice",
  "callId": "CA…",
  "from": "+14155550123",
  "to": "+14155559876",
  "direction": "outbound",
  "text": "what does this cost?",
  "recentHistory": [ { "role": "user", "content": "…" }, { "role": "assistant", "content": "…" } ]
}
```

`from`/`to` are the real call parties — on an outbound call `to` is the callee, on inbound `from` is the caller — and `direction` tells you which kind of call this is without keeping your own call-id map. `recentHistory` is the last 10 turns (your backend keeps its own state if it wants more). Floe sends no auth header on this request, so put a secret in the URL path (`https://your-server/voice/<random-token>`) and require it.

Reply with NDJSON, one JSON object per line:

```ndjson
{"text":"Let me check that","interim":true}
{"text":"It's four cents so far — transport, transcription, and speech, itemized."}
```

* `{"text":"…","interim":true}` — progress lines; used only as a fallback if no final line arrives.
* `{"text":"…"}` — final lines; concatenated in order and spoken (capped at 1500 characters per turn).
* `{"text":"Goodbye!","end":true}` — speak the final text, then **hang up gracefully**. A text-less `{"end":true}` hangs up silently. This is the in-band call-end directive — the natural way to finish a conversation, honor an opt-out ("take me off your list" → confirm → end), or wrap up when a budget is nearly exhausted. `end` is honored on final lines only.

Your backend has 30 seconds to respond; a non-2xx, timeout, or empty reply ends the call (`llm_refused`). Keep replies fast — the caller is waiting on the line.

```bash
curl -X PATCH https://credit-api.floelabs.xyz/v1/developer/agents/42/voice \
  -H "Authorization: Bearer $FLOE_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"voiceMode": "hosted", "systemPrompt": "You are the support line for Acme.", "beginMessage": "Hi, this is Acme support!"}'
```

PATCH fields (all optional; empty string clears): `voiceMode`, `systemPrompt` (hosted), `beginMessage` (spoken on connect), `voice` (TTS voice id), `model` (gateway model slug, default `openai/gpt-5.4-mini`), `webhookUrl` (required for webhook mode, https only).

## Call lifecycle webhooks

Subscribe a [developer webhook](webhooks.md) to `call.*` to close the loop without polling. Floe Phone emits:

* **`call.started`** — the call was answered. Payload: `{ agentWalletAddress, callId, phoneNumber, direction, from, to }`.
* **`call.ended`** — the call finished and settled. Payload: `{ agentWalletAddress, callId, phoneNumber, direction, reason, durationSeconds, transportRaw, sttRaw, ttsRaw, taskId, customerId }` — the per-leg costs are the settled ledger amounts, so this one event is a complete per-call cost receipt. `reason` is the termination cause (`call_ended`, `agent_ended`, `budget_exhausted`, `reserve_exhausted`, `max_duration`, `llm_refused`, …). If the media session crashed and the carrier's status callback settled the call instead, the same event arrives with `reason: "backstop_settled"`, `backstop: true`, and `sttRaw`/`ttsRaw` of `"0"` (unknown legs settle toward you, not against you).

Both events correlate on `callId`. Delivery is at-least-once — retries of the same delivery share a stable `X-Floe-Delivery-Id`, so [deduplicate on that header](webhooks.md) and route your handler on the `event` field; use `callId` only to correlate the lifecycle events with each other.

## Dashboard

Everything above is also in the [developer dashboard](developer-dashboard.md): open an agent and use the **Floe Phone** panel to buy a number by area code, switch voice modes, set the prompt and greeting, run a one-click test call, watch renewal state, and see per-call spend. The vendor card lives in the marketplace under **Telephony → Floe Phone**.
