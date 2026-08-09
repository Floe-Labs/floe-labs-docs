---
icon: microphone-lines
---

# Govern your Bland spend with Floe — no migration

Connect your Bland agent's end-of-call webhook to Floe and you get **every call reconciled onto one ledger** with a **between-call circuit breaker** — without leaving Bland or changing vendors.

Bland has **no self-serve custom LLM** and there's no adapter recipe for it, so there is **no model-leg step here** — this is a **reconcile-only** flow: connect the webhook, then set a cap. Two steps.

**Prerequisites**

- A Floe account + an **agent key** (`floe_…`) — [dashboard](https://dev-dashboard.floelabs.xyz) or `POST /v1/developer/agents/:agentId/keys`.
- A Bland agent you can edit.

> This is the same flow documented in depth (all five platforms) in [Govern Vapi / Retell / Bland / Pipecat / LiveKit](../build/voice-orchestrators.md) — this page is the focused Bland quickstart.

---

## Step 1 — Connect the end-of-call webhook

This is Reconcile Mode: Bland posts each call's real cost to Floe at call-end, so **every leg** (model, STT, TTS, telephony) lands on the same ledger.

**Register the connection** (admin — dashboard, or the API with an admin dashboard session). A **signing secret is required at registration** — supply one, then set the same value in Bland so it can sign each delivery:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/orchestrators \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin dashboard session>" \
  -d '{ "agentId": <your-agent-id>, "provider": "bland", "label": "support line", "secret": "<your signing secret>" }'
```

The response returns the connection URL:

```json
{
  "webhookUrl": "https://credit-api.floelabs.xyz/v1/webhooks/bland/call-end/<token>"
}
```

In **Bland**: point the agent's webhook at the returned `webhookUrl`. Bland signs each delivery with the header **`x-webhook-signature`** — a hex **HMAC-SHA256 of the raw request body**, keyed by the signing secret you registered. Floe recomputes it and rejects a bad signature `401`; an unknown or disabled token is `404`. Treat the URL as a secret — rotate with `POST /v1/developer/orchestrators/:id/rotate`.

**Verify** → end a call. A **reconciled debit** appears on the ledger within moments, attributed to the agent.

---

## Step 2 — Set a cap

Add a spend policy with the **kill-switch** action so a breach doesn't just decline one call — it suspends the agent.

- **Dashboard** → *Spend Controls* → add a policy (session or window cap) with action **Suspend agent**.
- **API** → set a policy with `"action": "suspend_agent"`. See [Spend Controls](../developers/spend-controls.md) for the policy shape and windows.

When the cap is crossed by a reconciled call, **the whole agent is suspended — every subsequent Floe-keyed action is rejected at authentication with `403`** until you resume it.

{% hint style="warning" %}
Bland has no pre-call webhook, so the breaker works differently here: a reconciled breach suspends the agent, which hard-blocks every subsequent Floe-keyed action — model, STT/TTS, and telephony legs on Floe keys — rather than rejecting the inbound call itself. The more legs you route through Floe, the harder the stop. This is the honest boundary, not a bug.
{% endhint %}

**Verify** → cross the cap → the agent's next Floe-keyed action is denied `403`.

---

## Your coverage score

The per-agent **coverage score** in the [dashboard](https://dev-dashboard.floelabs.xyz) shows the split — **% of spend pre-call enforceable vs post-call reconciled** — across every platform the agent runs on. On Bland everything is **post-call reconciled** (there's no pre-call leg to gate), so the breaker's bite depends on how much you route through Floe: **moving legs onto Floe keys is what gives the breaker teeth**. See [Coverage Score](../build/coverage-score.md).

To **raise** it, move more legs onto Floe rails — model and STT/TTS via [Floe Inference](../developers/keyless-inference.md), telephony via [Floe Phone](../developers/floe-phone.md). The full path is [Graduate to 100% coverage](../build/migrate-to-full-coverage.md).

---

{% hint style="info" %}
**The honest boundary.** On Bland, Floe governs the call **post-call — reconciled onto the ledger, with a between-call circuit breaker** (`suspend_agent`). There is no pre-call hook and no custom-LLM leg to gate, so Floe does **not** deny an inbound call or intervene mid-call: a reconciled breach suspends the agent and hard-blocks its **next** Floe-keyed action. The more legs on Floe keys, the harder that stop lands.
{% endhint %}

---

## Troubleshooting

| Symptom | Cause & fix |
|---|---|
| Webhook returns `401` | The `x-webhook-signature` didn't verify. Confirm Bland is signing with the **same secret** you registered, over the **raw** request body (hex HMAC-SHA256). |
| Webhook returns `404` | The token in the `webhookUrl` is unknown or the connection is disabled. Re-copy the `webhookUrl` from the connection. |
| Over-budget agent still placed a call | Bland has **no pre-call hook** — enforcement is post-call. The agent is stopped at its **next Floe-keyed action** after the reconciled breach, not at admission. Route more legs through Floe to tighten the stop. |
| Want model/STT/TTS on Floe rails | Use [Floe Inference](../developers/keyless-inference.md) (BYOK or keyless) so those legs meter on your `floe_` key and fall under the breaker. |
