---
icon: microphone-lines
---

# Govern your Vapi spend with Floe — 10 minutes, no migration

Route your Vapi assistant's model leg through Floe and connect its end-of-call webhook, and you get **pre-call budget enforcement on the LLM leg** plus **every call reconciled onto one ledger** — without leaving Vapi or changing vendors. Three steps, ~10 minutes.

**Prerequisites**

- A Floe account + an **agent key** (`floe_…`) — [dashboard](https://dev-dashboard.floelabs.xyz) or `POST /v1/developer/agents/:agentId/keys`.
- A Vapi assistant you can edit.

> This is the same flow documented in depth (all five platforms) in [Govern Vapi / Retell / Bland / Pipecat / LiveKit](../build/voice-orchestrators.md) — this page is the focused Vapi quickstart.

---

## Step 1 — Route the LLM leg through Floe (2 min)

Vapi's **custom-llm** is OpenAI-compatible and streams, so it points **directly** at Floe's keyless gateway — no shim.

In your assistant's **Model → Custom LLM** settings:

```json
{
  "provider": "custom-llm",
  "url": "https://credit-api.floelabs.xyz/v1",
  "model": "openai/gpt-4o-mini"
}
```

- **`url`** — `https://credit-api.floelabs.xyz/v1` (Vapi appends `/chat/completions`).
- **`model`** — a **fully-qualified** catalog id, `provider/model` (e.g. `openai/gpt-4o-mini`, `anthropic/claude-haiku-4-5`). A bare `gpt-4o` is rejected — discover valid ids with `GET /v1/models`. See [Floe Inference](../developers/keyless-inference.md).
- **Auth** — create a Vapi **custom-llm credential** holding your `floe_` agent key. Vapi sends it as `Authorization: Bearer …` on every turn (model-config headers aren't reliable on Vapi; the credential is the supported path).

Every turn is now **metered per token and gated pre-call**: once the agent's cap is hit, the gateway refuses the turn with `402` *before* any tokens are bought. The LLM is the most expensive, most variable leg — up to ~60% of a typical call's cost.

**Verify** → make a test call. It shows up on the ledger as a **gateway row** attributed to the agent, with the per-call cost in the `X-Floe-Cost-USDC` response header.

---

## Step 2 — Connect the end-of-call webhook (3 min)

This is Reconcile Mode: Vapi posts each call's real cost to Floe at call-end, so **every leg** (STT, TTS, telephony) lands on the same ledger — not just the LLM.

**Register the connection** (admin — dashboard, or the API with an admin dashboard session):

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/orchestrators \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin dashboard session>" \
  -d '{ "agentId": <your-agent-id>, "provider": "vapi", "label": "support line" }'
```

The response returns a `webhookUrl` and a `secret` (shown once):

```json
{
  "webhookUrl": "https://credit-api.floelabs.xyz/v1/webhooks/vapi/call-end/<token>",
  "preCallUrl": "https://credit-api.floelabs.xyz/v1/webhooks/vapi/pre-call/<token>",
  "secret": "<shown once>"
}
```

In **Vapi**: set the assistant's (or org's) **Server URL** to the `webhookUrl`, and set the returned **`secret`** as the server credential. Vapi sends it back in the `X-Vapi-Secret` header on every delivery, and Floe verifies it (a wrong or missing secret is rejected `401`; an unknown/disabled token is `404`). Treat the URL as a secret — rotate with `POST /v1/developer/orchestrators/:id/rotate`.

> **Optional — deny the next call before it connects.** Also set the phone number's Server URL to `preCallUrl?assistantId=<your-assistant-id>`. When the agent is over budget, Floe returns an error Vapi speaks, and the call never starts. Without it, an over-budget agent is still stopped — just at its next Floe-keyed action (Step 3), not at admission.

**Verify** → end a call. A **reconciled debit** appears on the ledger within moments, attributed to the agent (sourced from Vapi's `message.cost`).

---

## Step 3 — Set a cap (2 min)

Add a spend policy with the **kill-switch** action so a breach doesn't just decline one call — it suspends the agent.

- **Dashboard** → *Budgets & alerts* → **Budgets** tab → add a policy (session or window cap) with action **Suspend agent**.
- **API** → set a policy with `"action": "suspend_agent"`. See [Spend Controls](../developers/spend-controls.md) for the policy shape and windows.

When the cap is crossed, the breaching call gets a `402` (carrying `"auto_suspended": true`) and **the whole agent is suspended — every subsequent call is rejected at authentication with `403`** until you resume it. A runaway campaign dies after call *N*, not call 10,000.

**Verify** → cross the cap → the next call is denied (`403` at admission, or the pre-call hook rejects it if you configured Step 2's `preCallUrl`).

---

## Your coverage score

The per-agent **coverage score** in the [dashboard](https://dev-dashboard.floelabs.xyz) shows the split — **enforceable pre-call vs post-call reconciled vs dark** — across every platform the agent runs on. With Step 1 you govern the LLM leg pre-call; Reconcile Mode (Step 2) puts the rest on the ledger and behind the circuit breaker; anything Floe never sees stays **dark**.

To **raise** it, move more legs onto Floe rails — STT/TTS via [Floe Inference](../developers/keyless-inference.md), telephony via [Floe Phone](../developers/floe-phone.md). The full path is [Graduate to 100% coverage](../build/migrate-to-full-coverage.md).

---

{% hint style="info" %}
**The honest boundary.** Floe enforces **pre-call on the LLM leg** (custom-llm through the gateway). STT, TTS, and telephony stay on Vapi and are governed **post-call — reconciled onto the ledger, with a between-call circuit breaker** (`suspend_agent`). Floe does **not** intervene mid-call: enforcement is either *before* a call (deny the next) or *after* it (reconcile + suspend). It never interrupts a call in progress.
{% endhint %}

---

## Troubleshooting

| Symptom | Cause & fix |
|---|---|
| Webhook returns `401` | The `X-Vapi-Secret` Vapi sent doesn't match the connection's secret. Re-set the secret on the Vapi server credential, or rotate it (`POST /v1/developer/orchestrators/:id/rotate`). |
| Webhook returns `404` | The token in the `webhookUrl` is unknown or the connection is disabled. Re-copy the `webhookUrl` from the connection. |
| LLM calls fail with `model_not_found` | Use the **fully-qualified** `provider/model` id (`openai/gpt-4o-mini`) — a bare `gpt-4o` is rejected on `/v1/chat/completions`. List valid ids with `GET /v1/models`. |
| Want to keep paying your own model vendor | Use **BYOK**: pass `X-Floe-Provider-Key: <your key>` (or store it once). Floe meters and charges its service fee only. See [Floe Inference](../developers/keyless-inference.md). |

---

## Retell & Bland

The webhook + cap steps (2 and 3) work the same way — register the connection with `provider: "retell"` or `"bland"` and use the returned URLs. The **model leg differs**, so don't copy Step 1 blindly:

- **Retell** — custom-LLM is **not** a URL swap; Retell dials out to a **WebSocket adapter you host** (its own protocol). Use the [retell-custom-llm recipe](https://github.com/Floe-Labs/floe-cookbook/tree/main/retell-custom-llm).
- **Bland** — **no self-serve custom LLM** (enterprise-only). Skip Step 1 and govern the whole call via **Reconcile Mode** (Steps 2–3); Bland has no pre-call hook, so enforcement is at the agent's next Floe-keyed action after a reconciled breach.

Full per-platform detail: [Govern Vapi / Retell / Bland / Pipecat / LiveKit](../build/voice-orchestrators.md).
