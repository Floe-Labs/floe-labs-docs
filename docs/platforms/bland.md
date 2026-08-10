---
icon: microphone-lines
---

# Govern your Bland spend with Floe — no migration

Connect your Bland agent's end-of-call webhook to Floe and you get **every call reconciled onto one ledger** with a **between-call circuit breaker** — then add one **Webhook node** to your Bland Pathway to get **pre-call admission** on top, so an over-budget agent is turned away *before* the conversation starts. No leaving Bland, no changing vendors.

Bland has **no self-serve custom LLM** and there's no adapter recipe for it, so there is **no model-leg step here**. But Bland is **not** reconcile-only: its **Pathway Webhook node** gives you a real pre-call gate. Three steps — reconcile, admit, cap.

**Prerequisites**

- A Floe account + an **agent key** (`floe_…`) — [dashboard](https://dev-dashboard.floelabs.xyz) or `POST /v1/developer/agents/:agentId/keys`.
- A Bland agent you can edit.
- A Bland **Pathway** you can edit — needed for pre-call admission (Step 2).

> This is the same flow documented in depth (all five platforms) in [Govern Vapi / Retell / Bland / Pipecat / LiveKit](../build/voice-orchestrators.md) — this page is the focused Bland quickstart.

---

## Step 1 — Connect the end-of-call webhook

This is Reconcile Mode: Bland posts each call's real cost to Floe at call-end, so **every leg** (model, STT, TTS, telephony) lands on the same ledger.

**Register the connection** (admin — dashboard, or the API with an admin dashboard session). A **signing secret is required at registration** — copy the **webhook signing secret** from your Bland dashboard (Settings → Keys; shown once) and supply that exact value:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/orchestrators \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin dashboard session>" \
  -d '{ "agentId": <your-agent-id>, "provider": "bland", "label": "support line", "secret": "<your Bland webhook signing secret>" }'
```

The response returns the connection URL:

```json
{
  "webhookUrl": "https://credit-api.floelabs.xyz/v1/webhooks/bland/call-end/<token>",
  "preCallUrl": "https://credit-api.floelabs.xyz/v1/webhooks/bland/pre-call/<token>"
}
```

In **Bland**: point the agent's webhook at the returned `webhookUrl`. Bland signs each delivery with the header **`x-webhook-signature`** — a hex **HMAC-SHA256 of the raw request body**, keyed by the signing secret you registered. Floe recomputes it and rejects a bad signature `401`; an unknown or disabled token is `404`. Treat the URL as a secret — rotate with `POST /v1/developer/orchestrators/:id/rotate`.

The same connection also exposes a **`preCallUrl`** (also shown on the Orchestrators connection card) — you'll wire that into your Pathway in **Step 2** for pre-call admission.

**Verify** → end a call. A **reconciled debit** appears on the ledger within moments, attributed to the agent.

---

## Step 2 — Add pre-call admission (Pathway Webhook node)

Bland has no *native* pre-call webhook — but its **Pathway Webhook node** does the job. Make the **first node** of your Bland Pathway a **Webhook node** that asks Floe whether this agent may proceed, and branch on the answer. An over-budget agent is routed straight to hang-up before the conversation begins — **real pre-call enforcement, not just after-the-fact accounting**.

Use the **`preCallUrl`** from the same connection (shown on the Orchestrators connection card, form `https://credit-api.floelabs.xyz/v1/webhooks/bland/pre-call/<token>`).

In your Bland **Pathway**:

1. Add a **Webhook node** as the **first node** of the pathway, set to **POST** the `preCallUrl`.
2. Enable **"Response Data"** on the node so the pathway can branch on the HTTP status.
3. Add a **conditional edge** off the node:
   - **non-200** (e.g. `402`) → route to an **End Call** node.
   - **200** → continue to your normal first node.

Floe answers:

```jsonc
// 200 — admit
{ "allowed": true }
// 402 — over budget → route to End Call
{ "allowed": false, "reason": "..." }
```

**Auth — no signature header.** This pre-call URL authenticates on its **capability token alone** (the `<token>` in the URL). A static Pathway Webhook node can't compute an HMAC and the check is read-only, so there is **no** `x-webhook-signature` here (unlike the Step 1 call-end webhook). Treat the URL as a secret; rotate it with `POST /v1/developer/orchestrators/:id/rotate`.

**Verify** → cross the cap (Step 3), then start a call. The Pathway's first hop gets `402` / `{ "allowed": false }` and routes straight to **End Call** — the conversation never begins.

---

## Step 3 — Set a cap

Add a spend policy with the **kill-switch** action so a breach doesn't just decline one call — it suspends the agent.

- **Dashboard** → *Spend Controls* → add a policy (session or window cap) with action **Suspend agent**.
- **API** → set a policy with `"action": "suspend_agent"`. See [Spend Controls](../developers/spend-controls.md) for the policy shape and windows.

When the cap is crossed by a reconciled call, **the whole agent is suspended — every subsequent Floe-keyed action is rejected at authentication with `403`** until you resume it.

{% hint style="warning" %}
Bland has no *native* pre-call webhook, so admission runs through the **Pathway Webhook node** (Step 2) rather than a phone-number hook: the pathway's first hop asks Floe and routes an over-budget agent to **End Call** before the conversation starts. The reconcile-driven `suspend_agent` breaker (this step) is the backstop — a reconciled breach hard-blocks every subsequent Floe-keyed action (model, STT/TTS, telephony legs on Floe keys). Together: the Pathway node stops the *next* call at admission, and the breaker guarantees a runaway dies after call *N*, not call 10,000. The more legs you route through Floe, the harder the stop.
{% endhint %}

**Verify** → cross the cap → the next call's Pathway admission node gets `402` (Step 2), and the agent's next Floe-keyed action is denied `403`.

---

## Your coverage score

The per-agent **coverage score** in the [dashboard](https://dev-dashboard.floelabs.xyz) shows the split — **enforceable pre-call vs post-call reconciled vs dark** — across every platform the agent runs on. On Bland, the individual legs Bland runs (model, STT, TTS, telephony) are all **post-call reconciled** — there's no custom-LLM or media-path swap to meter a single leg pre-call. What the **Pathway Webhook node** (Step 2) adds is **whole-call admission**: it gates the *call* before it starts even though it can't meter one leg. Anything Floe never sees stays **dark**, so the breaker's bite still grows the more legs you move onto **Floe rails**. See [Coverage Score](../build/coverage-score.md).

To **raise** it, move more legs onto Floe rails — model and STT/TTS via [Floe Inference](../developers/keyless-inference.md), telephony via [Floe Phone](../developers/floe-phone.md). The full path is [Graduate to 100% coverage](../build/migrate-to-full-coverage.md).

---

{% hint style="info" %}
**The honest boundary.** Bland has no custom-LLM leg to meter and no *native* pre-call webhook, so Floe can't gate a single leg pre-call or interrupt a call in progress. What you **can** do: **admit or reject the whole call before it starts** via the Pathway Webhook node (Step 2), and **reconcile every call post-call** behind a between-call circuit breaker (`suspend_agent`, Step 3). A reconciled breach suspends the agent and hard-blocks its **next** Floe-keyed action; the Pathway node turns the next call away at admission. The more legs on Floe keys, the harder that stop lands. Full cross-platform reference: [Govern Vapi / Retell / Bland / Pipecat / LiveKit](../build/voice-orchestrators.md).
{% endhint %}

---

## Troubleshooting

| Symptom | Cause & fix |
|---|---|
| Webhook returns `401` | The `x-webhook-signature` didn't verify. Confirm Bland is signing with the **same secret** you registered, over the **raw** request body (hex HMAC-SHA256). |
| Webhook returns `404` | The token in the `webhookUrl` is unknown or the connection is disabled. Re-copy the `webhookUrl` from the connection. |
| Over-budget agent still connected the call | If you added the **Pathway Webhook node** (Step 2), confirm it's the **first** node, that "Response Data" is enabled, and that the conditional edge routes **non-200 → End Call**. Without that node, admission is post-call only: the agent is stopped at its **next Floe-keyed action** after the reconciled breach, not at this call's start. |
| Pathway pre-call node returns `404` (or asks for a signature) | The `<token>` in the `preCallUrl` is unknown or the connection is disabled — re-copy the `preCallUrl` from the connection card. The pre-call URL authenticates on its **token alone**; don't add an `x-webhook-signature` header to this node. |
| Pathway continues past a budget breach | The conditional edge isn't branching on status. Enable **"Response Data"** and edge on **non-200 → End Call**; Floe returns `402` `{ "allowed": false }` when over budget. |
| Want model/STT/TTS on Floe rails | Use [Floe Inference](../developers/keyless-inference.md) (BYOK or keyless) so those legs meter on your `floe_` key and fall under the breaker. |
