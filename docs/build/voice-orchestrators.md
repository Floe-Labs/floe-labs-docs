# Govern Vapi / Retell / Bland spend with Floe

You build on a voice orchestrator — Vapi, Retell, or Bland — and the platform
executes the call: STT, LLM, TTS, telephony. Floe governs that spend in two
complementary ways, and is honest about which is which:

- **Pre-call, where Floe is in the path.** Route the leg the orchestrator lets
  you redirect (the LLM — typically the biggest, most variable line) through
  Floe's gateway: metered per token, refused with `402` *before* tokens are
  bought once your cap is hit.
- **Circuit-breaker everywhere else.** **Reconcile Mode** ingests the
  orchestrator's own end-of-call webhook, writes the full call cost to your
  Floe ledger, counts it against your spend policies, and enforces at the
  *next session*: a tripped `suspend_agent` policy blocks the agent's next
  Floe-keyed call, and the pre-call webhook rejects the next orchestrator
  call. You can't stop mid-call — you guarantee a runaway dies after call
  *N*, not call 10,000.

> **The promise, stated honestly.** Pre-call where we're in the path;
> circuit-breaker everywhere else. No orchestrator partnership required —
> both mechanisms use each platform's documented extension points.

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
Vapi sends it as `Authorization: Bearer …` on every turn. (Don't rely on
custom headers in the model config; the credential is the supported path.)

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
1. Connect with `"provider": "retell"` and `"secret": "<your Retell API key>"`
   — Retell signs webhooks (`x-retell-signature`) with your **API key**, so
   Floe needs it to verify. Stored sealed (AES-256-GCM), never returned.
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
  fires the `agent.suspended` webhook; near-limit thresholds fire
  `credit.warning` / `credit.at_limit`.
- **Does not debit your Floe balance.** That money was paid to the
  orchestrator, not Floe — reconciled spend is a *governance* signal, not a
  second bill. Your spendable balance is untouched; your budgets are not.
- **Is idempotent.** Providers retry webhooks; each call id is ingested once.
- Unsigned or mis-signed deliveries are rejected `401` with **no** ledger
  write.

## Coverage, honestly

With the LLM leg routed (§1) you govern the majority of per-call cost
pre-call; with Reconcile Mode (§2) the rest is on the ledger and
circuit-broken. The per-agent **coverage score** in the dashboard shows the
split — % pre-call enforceable vs post-call reconciled — and the way to raise
it is to move legs onto Floe rails: STT/TTS via [Floe Inference](../developers/keyless-inference.md),
telephony via [Floe Phone](../developers/floe-phone.md), or the full path via
[Pipecat / LiveKit on Floe](voice-stack.md#live-voice-with-your-own-stack-livekit-pipecat).
