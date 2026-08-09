# Govern voice-orchestrator spend with Floe

> **Setting up one platform?** Start with the quickstart: [Vapi](../platforms/vapi.md) · [Retell](../platforms/retell.md) · [Bland](../platforms/bland.md). This page is the full reference across all five (Pipecat and LiveKit included).

You build on a voice orchestrator and the framework executes the call: STT,
LLM, TTS, telephony. Floe governs that spend in two complementary ways, and is
honest about which is which:

- **Pre-call / live-metered, where Floe is in the path.** Route the legs you can
  redirect through Floe's gateway. **Request legs** (LLM turns, one-shot TTS,
  batch STT) are refused with `402` *before* the spend happens once your cap is
  hit. **Duration-billed legs** (streaming STT, phone) are metered **live** and
  cut off mid-stream the instant the next charge would breach the cap — so a
  small partial spend can land after admission, never a whole runaway call.
- **Circuit-breaker everywhere else.** **Reconcile Mode** writes the full call
  cost to your Floe ledger, counts it against your spend policies, and enforces
  at the *next session*: a tripped `suspend_agent` policy blocks the agent's
  next Floe-keyed call, and a configured pre-call hook rejects the next eligible
  inbound call. You can't stop mid-call — you guarantee a runaway dies after
  call *N*, not call 10,000.

> **The promise, stated honestly.** Pre-call where we're in the path;
> circuit-breaker everywhere else. No orchestrator partnership required —
> both mechanisms use each platform's documented extension points.

## Two families, two cost signals

The five orchestrators split into two architectures, and that split decides how
Reconcile Mode gets its numbers — so we're explicit about it:

- **Hosted platforms — Vapi, Retell, Bland.** The platform runs the call and
  emits an **end-of-call webhook carrying the real call cost** (Vapi
  `message.cost`, Retell `call_cost.combined_cost`, Bland `price`). Reconcile
  Mode ingests that webhook directly. Nothing to compute on your side.
- **Self-hosted frameworks — Pipecat, LiveKit.** These are open-source
  frameworks *you* run. **They emit no cost webhook** — there is no platform to
  send one. So the model flips: route their legs through Floe for real pre-call
  enforcement (preferred), and if a leg stays off Floe rails, your own agent
  **self-reports** its cost to a Floe webhook as the circuit-breaker fallback.
  See [Self-hosted frameworks](#3-self-hosted-frameworks-pipecat-livekit) below.

### Coverage boundary per platform

Which leg is enforceable pre-call vs governed post-call, and where the cost
number comes from:

| Platform | Type | LLM | STT | TTS | Telephony | Cost signal |
|---|---|---|---|---|---|---|
| **Vapi** | Hosted | Pre-call ✓ (custom-llm) | Reconciled ⟳ | Reconciled ⟳ | Reconciled ⟳ | Provider webhook (`message.cost`) |
| **Retell** | Hosted | Pre-call ✓ (WS adapter) | Reconciled ⟳ | Reconciled ⟳ | Reconciled ⟳ | Provider webhook (`call_cost.combined_cost`) |
| **Bland** | Hosted | Reconciled ⟳ (no self-serve custom LLM) | Reconciled ⟳ | Reconciled ⟳ | Reconciled ⟳ | Provider webhook (`price`) |
| **Pipecat** | Self-hosted | Pre-call ✓ *if routed through Floe* | Live-metered ⏱ *if routed through Floe* | Pre-call ✓ *if routed through Floe* | Live-metered ⏱ *if routed through Floe* | Metered by Floe on routed legs · **self-reported** off-Floe |
| **LiveKit** | Self-hosted | Pre-call ✓ *if routed through Floe* | Live-metered ⏱ *if routed through Floe* | Pre-call ✓ *if routed through Floe* | Live-metered ⏱ *if routed through Floe* | Metered by Floe on routed legs · **self-reported** off-Floe |

Legend: **Pre-call ✓** = a request leg refused *before* its spend; **Live-metered
⏱** = a duration-billed leg (streaming STT, phone) metered during the session and
cut off when the next charge would breach the cap — a small partial spend can land
after admission; **Reconciled ⟳** = counted after the call, enforced next session;
**Self-reported** = your agent POSTs the cost (Pipecat/LiveKit only — there is no
platform webhook to ingest).

> **Don't double-count.** For Pipecat/LiveKit, a leg **routed through Floe is
> already metered pre-call** — self-report **only** the legs you keep off Floe
> rails, never one Floe already carries.

## 1 · Route the LLM leg through Floe (pre-call)

| Orchestrator | Mechanism | Effort |
|---|---|---|
| **Vapi** | `custom-llm` → point `model.url` at Floe. Direct, streaming, no shim. | One config field |
| **Retell** | Custom-LLM **WebSocket** (Retell's protocol, not OpenAI HTTP) → a ~150-line adapter that calls Floe per turn. | Small server ([recipe](https://github.com/Floe-Labs/floe-cookbook/tree/main/retell-custom-llm)) |
| **Bland** | No self-serve custom LLM (enterprise-only). | Use Reconcile Mode |

{% tabs %}
{% tab title="Vapi" %}
Vapi's custom-llm is OpenAI-compatible and streams — it can point **directly**
at Floe's gateway:

```jsonc
// assistant.model
{
  "provider": "custom-llm",
  "url": "https://credit-api.floelabs.xyz/v1",   // Vapi appends /chat/completions
  "model": "openai/gpt-4o-mini",                  // any Floe catalog slug — GET /v1/models
  "metadataSendMode": "off"
}
```

Auth: create a Vapi **custom-llm credential** holding your `floe_` agent key —
Vapi sends it as `Authorization: Bearer …` on every turn. (Vapi does support
custom headers on custom-llm models, but `Authorization` is handled
separately — it must come from the credential.)

Every turn is metered per token and pre-call gated: past the cap, the gateway
refuses with `402` before any tokens are bought. On a direct integration that
`402` surfaces to Vapi as an LLM failure — exact enforcement, abrupt ending.
For a spoken *"I've reached my budget limit"* goodbye, run the graceful-stop
shim from the [vapi-custom-llm recipe](https://github.com/Floe-Labs/floe-cookbook/tree/main/vapi-custom-llm)
and point `model.url` at it instead.
{% endtab %}

{% tab title="Retell" %}
Retell's custom LLM is a **WebSocket protocol**, not a base-URL swap: Retell
connects out to your server (`response_engine.llm_websocket_url`) and sends
`response_required` messages; you stream `response` chunks back.

The [retell-custom-llm recipe](https://github.com/Floe-Labs/floe-cookbook/tree/main/retell-custom-llm)
is that server: each turn becomes a streaming call to
`https://credit-api.floelabs.xyz/v1/chat/completions` on your `floe_` key —
metered, pre-call gated, and on `402` the adapter **speaks** the budget stop
and sets `end_call: true` so the call ends cleanly.
{% endtab %}

{% tab title="Bland" %}
Bland exposes **no self-serve custom LLM** (the `model` parameter is an enum
of Bland-hosted models; custom model integration is an enterprise
engagement). The LLM leg cannot be redirected — govern Bland with
**Reconcile Mode** below, and note Bland's own kill switches
(`POST /v1/calls/{id}/stop`, org-wide `POST /v1/calls/active/stop`) are the
strongest of the three for emergencies.
{% endtab %}
{% endtabs %}

## 2 · Reconcile Mode (post-call → next-session enforcement)

Connect an agent to an orchestrator once; Floe mints a webhook URL you paste
into the platform's settings.

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/orchestrators \
  -H "Cookie: <dashboard session>" -H "Content-Type: application/json" \
  -d '{ "agentId": 42, "provider": "vapi" }'
```

```jsonc
// 201 — secret shown ONCE (vapi: Floe mints it; retell/bland: you supply it)
{
  "id": 7,
  "provider": "vapi",
  "webhookUrl":  "https://credit-api.floelabs.xyz/v1/webhooks/vapi/call-end/<token>",
  "preCallUrl":  "https://credit-api.floelabs.xyz/v1/webhooks/vapi/pre-call/<token>",
  "secret": "whsec_…"
}
```

Treat both URLs as secrets: the `<token>` path segment is the bearer
credential that authenticates the provider's requests, so keep the URLs out
of logs and any config third parties can read. If one leaks,
`POST /v1/developer/orchestrators/{id}/rotate` mints a new token (and
secret) — update the platform's settings with the new URLs.

{% tabs %}
{% tab title="Vapi" %}
1. In Vapi, set the assistant's (or org's) **Server URL** to `webhookUrl` and
   configure the returned `secret` on the server credential — Vapi delivers it
   back in `X-Vapi-Secret`, which Floe verifies.
2. Every `end-of-call-report` (`message.cost`, USD) becomes a ledger row
   attributed to your agent — visible in the dashboard, counted against your
   session/task/API policies.
3. **Pre-call deny (inbound):** for numbers *without* a fixed assistant, point
   the number's Server URL at `preCallUrl?assistantId=<your-assistant-id>`.
   Admitted requests get your assistant back; an over-budget or suspended
   agent gets `{"error": "…"}` — Vapi speaks it and the call never starts.
4. Tag calls with `metadata.floe_task_id` on the Vapi side to attribute them
   to a Floe task budget.
{% endtab %}

{% tab title="Retell" %}
1. Connect with `"provider": "retell"` and `"secret": "<your Retell webhook
   key>"` — Retell signs webhooks (`x-retell-signature`) with the API key
   **designated as the webhook key** in your Retell dashboard, so that exact
   key is what Floe needs to verify (any other Retell key fails
   verification). Stored sealed (AES-256-GCM), never returned.
2. Set the agent's **webhook URL** to `webhookUrl`. Floe ingests
   `call_ended` / `call_analyzed` (`call_cost.combined_cost` — cents).
3. **Pre-call deny:** set the phone number's **inbound webhook** to
   `preCallUrl`. An over-budget agent's next inbound call gets
   `{"call_inbound": {"reject": true}}` — Retell hangs up before any agent
   or voice setup; no call object is even created.
{% endtab %}

{% tab title="Bland" %}
1. Connect with `"provider": "bland"` and `"secret"` = the **webhook signing
   secret** from the Bland dashboard (Settings → Keys — shown once there too).
2. Pass `webhookUrl` as the `webhook` param on `POST /v1/calls` (or set it on
   the inbound number). Floe verifies `X-Webhook-Signature` and ingests the
   post-call payload (`price` USD, `call_length` minutes).
3. Bland has **no pre-call hook** — the circuit breaker is: reconciled spend
   trips your `suspend_agent` policy → the agent's next *Floe-keyed* action
   (including placing calls via your own dialer) is refused `403`. For live
   emergencies use Bland's stop APIs.
{% endtab %}
{% endtabs %}

### What a reconciled cost does — and deliberately does not — do

- **Counts against policies.** Reconciled rows enter the same spend
  derivation as every Floe-carried call: session caps, per-task budgets, and
  per-API caps keyed to the provider host (`api.vapi.ai`,
  `api.retellai.com`, `api.bland.ai`) all see it. A breached policy with
  `action: "suspend_agent"` suspends the agent (403 on its next call) and
  fires the `agent.suspended` webhook.
- **Does not debit your Floe balance.** That money was paid to the
  orchestrator, not Floe — reconciled spend is a *governance* signal, not a
  second bill. Your spendable balance is untouched; your budgets are not.
- **Is idempotent.** Providers retry webhooks; each call id is ingested once.
- Unsigned or mis-signed deliveries are rejected `401` with **no** ledger
  write.

## 3 · Self-hosted frameworks (Pipecat, LiveKit)

Pipecat and LiveKit are **open-source frameworks you run yourself** — not hosted
platforms. There is no vendor billing your call, and so **no end-of-call cost
webhook** to ingest. That changes the governance model in two ways.

### Preferred: route the legs through Floe (pre-call)

Because *you* wire up each service, you can put Floe directly in the path of
every leg — which is strictly better than reconcile: spend is refused *before*
it happens, not counted after.

- **LLM** — point the framework's LLM service `base_url` at
  `https://credit-api.floelabs.xyz/v1` with your `floe_` agent key.
  OpenAI-compatible, metered per token, `402` at the cap.
- **STT / TTS / telephony** — move each onto Floe rails
  ([streaming STT WS, `POST /v1/audio/speech`, Floe Phone](voice-stack.md#live-voice-with-your-own-stack-livekit-pipecat)).

This is the [Graduate to 100% coverage](migrate-to-full-coverage.md) path, and
for Pipecat the [`pipecat-floe`](https://github.com/Floe-Labs/pipecat-floe)
package makes it three drop-in services. **A leg on Floe rails needs no
reconcile at all** — it's already cap-enforced pre-call. Prefer this for every
leg you can.

### Fallback: self-report the cost (circuit-breaker)

For any leg you keep off Floe rails, there is no platform webhook — so **your
own agent reports the call's cost** to Floe at end-of-call. This is the same
next-session circuit-breaker as hosted Reconcile Mode; the only difference is
that you supply the number instead of a platform.

**1. Register the connection** — mints the webhook URL and a per-connection
signing secret. Also available in the dashboard UI (Agent → Orchestrators →
Connect → Pipecat / LiveKit):

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/orchestrators \
  -H "Cookie: <dashboard session>" -H "Content-Type: application/json" \
  -d '{ "agentId": 42, "provider": "pipecat" }'   # or "livekit"
```

```jsonc
// 201 — secret shown ONCE
{
  "id": 12,
  "provider": "pipecat",
  "webhookUrl": "https://credit-api.floelabs.xyz/v1/webhooks/pipecat/call-end/<token>",
  "preCallUrl": "https://credit-api.floelabs.xyz/v1/webhooks/pipecat/pre-call/<token>",
  "secret": "whsec_…"   // per-connection HMAC key — store it, it is not returned again
}
```

Self-hosted connections also get a **`preCallUrl`**, but it works differently
from the hosted platforms. There's no vendor to call it, so **your own agent**
invokes it as a *self-serve admission check* before it starts a session — it
returns `{ "allowed": boolean, "reason": string | null }`, and your code skips
(or downgrades) the call when `allowed` is `false`. The request contract:

```http
POST https://credit-api.floelabs.xyz/v1/webhooks/{pipecat|livekit}/pre-call/<token>
X-Floe-Signature: <hex HMAC-SHA256(secret, raw body)>
Content-Type: application/json

{}
```

The body is signed like any other delivery but its fields are **not** read — the
decision is the connection's current agent state and budget — so an empty `{}`
is fine (sign whatever bytes you send). Responses:

```jsonc
// 200 — admit
{ "allowed": true,  "reason": null }
// 200 — deny (skip/downgrade the session)
{ "allowed": false, "reason": "budget_exceeded" }   // also: agent_suspended, admission_unavailable
```

Mis-signed or unsigned → `401`; unknown / disabled / wrong-provider token → `404`.

Because you call this yourself, it's a **cooperative** signal your agent must
honor — and its scope is narrow: the hard, un-bypassable circuit-breaker is the
reconciled-spend → `suspend_agent` path, which refuses the agent's next
**Floe-keyed** call with `403` but **cannot** stop it from calling providers
**off** Floe rails. Any leg you keep off Floe therefore stays dependent on your
agent honoring the check. The strongest pre-call enforcement remains routing
legs through Floe (above), where spend is refused before it happens rather than
checked by your own code.

**2. POST the cost when the call ends** — a Floe-native JSON body, signed with
the per-connection secret:

```bash
BODY='{
  "external_call_id": "pc_5f3a…",
  "cost_usd": 0.043,
  "duration_seconds": 182,
  "floe_task_id": "call-8842"
}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$FLOE_ORCH_SECRET" -hex | sed 's/^.* //')

curl -X POST https://credit-api.floelabs.xyz/v1/webhooks/pipecat/call-end/<token> \
  -H "Content-Type: application/json" \
  -H "X-Floe-Signature: $SIG" \
  -d "$BODY"
```

Body fields:

| Field | Required | Notes |
|---|---|---|
| `external_call_id` | yes | Your call's id — the idempotency key; each id is ingested once. |
| `cost_usd` | one of (`cost_usd`, `cost_micro_usdc`) | Call cost in USD. |
| `cost_micro_usdc` | one of (`cost_usd`, `cost_micro_usdc`) | Same cost as integer micro-USDC (10⁻⁶), if you'd rather avoid floats. Supply exactly one of `cost_usd` / `cost_micro_usdc`. |
| `duration_seconds` | no | Call length, for reporting. |
| `floe_task_id` | no | Attribute the cost to a Floe task budget. |
| `floe_customer_id` | no | Attribute the cost to an end customer. |

**Signature:** `X-Floe-Signature: <hex>` where `<hex>` is
`HMAC-SHA256(secret, rawBody)` over the **exact bytes** you send (sign the
serialized string, don't re-serialize). Mis-signed or unsigned deliveries are
rejected `401` with no ledger write. Rotate a leaked secret with
`POST /v1/developer/orchestrators/{id}/rotate`.

Once ingested, a self-reported cost behaves exactly like any reconciled row
(next section): counts against your policies, doesn't debit your balance,
idempotent per `external_call_id`.

## Coverage, honestly

With the LLM leg routed (§1) you govern the majority of per-call cost
pre-call; with Reconcile Mode (§2) the rest is on the ledger and
circuit-broken. The per-agent **coverage score** in the dashboard shows the
split — % pre-call enforceable vs post-call reconciled — and the way to raise
it is to move legs onto Floe rails: STT/TTS via [Floe Inference](../developers/keyless-inference.md),
telephony via [Floe Phone](../developers/floe-phone.md), or the full path via
[Pipecat / LiveKit on Floe](voice-stack.md#live-voice-with-your-own-stack-livekit-pipecat).
