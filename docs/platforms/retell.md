---
icon: microphone-lines
---

# Govern your Retell spend with Floe — no migration

Route your Retell agent's model leg through Floe and connect its end-of-call webhook, and you get **pre-call budget enforcement on the LLM leg** plus **every call reconciled onto one ledger** — without leaving Retell or changing vendors. Three steps.

**Prerequisites**

- A Floe account + an **agent key** (`floe_…`) — [dashboard](https://dev-dashboard.floelabs.xyz) or `POST /v1/developer/agents/:agentId/keys`.
- A Retell agent you can edit, and your **Retell API key** (you'll need it both to host the adapter and to register the webhook connection).
- Somewhere to run a small Node server (the recipe adapter) reachable over `wss://`.

> This is the same flow documented in depth (all five platforms) in [Govern Vapi / Retell / Bland / Pipecat / LiveKit](../build/voice-orchestrators.md) — this page is the focused Retell quickstart.

---

## Step 1 — Route the LLM leg through Floe (recipe adapter)

**This is not a URL swap.** Retell's custom-LLM does **not** point at an OpenAI-compatible base URL. Instead, Retell dials **out** to a WebSocket **you host** — `wss://…/llm/<secret>/<call_id>` — and speaks its own protocol (`response_required` in → `response` chunks out). So you run a small adapter that turns each Retell turn into a **streaming Floe gateway call**.

Use the ready-made recipe — a ~150-line server — rather than writing your own:

[**retell-custom-llm recipe**](https://github.com/Floe-Labs/floe-cookbook/tree/main/retell-custom-llm)

First get a `floe_…` **agent key** — from the [dashboard](https://dev-dashboard.floelabs.xyz) or `npx @floelabs/cli init` — and put it in `.env` as `FLOE_API_KEY` (alongside your `RETELL_API_KEY`):

```bash
cp .env.example .env      # RETELL_API_KEY, FLOE_API_KEY, path secret, model
npm install
npm start                 # the adapter (expose it, e.g. ngrok → your wss URL)
npm run setup             # sets the Floe cap, creates the Retell agent
```

- **`model`** — set a **fully-qualified** catalog id, `provider/model` (e.g. `openai/gpt-4o-mini`, `anthropic/claude-haiku-4-5`). A bare `gpt-4o` is rejected — discover valid ids with `GET /v1/models`. See [Floe Inference](../developers/keyless-inference.md).
- **Auth** — every turn is metered on your one `floe_` agent key inside the adapter. The Retell socket itself has no auth header; the unguessable path secret (`<secret>` in the URL) **is** the auth, so keep it long.

Every turn is now **metered per token and gated pre-call**: once the agent's cap is hit, the turn that would start past it is refused `402` *before* any tokens are bought. The adapter then speaks a budget message and sets `end_call: true` so Retell hangs up cleanly. The LLM is the most expensive, most variable leg — up to ~60% of a typical call's cost.

**Verify** → make a test call. It shows up on the ledger as a **gateway row** attributed to the agent (`GET /v1/agents/transactions` on your Floe key).

---

## Step 2 — Connect the end-of-call webhook

This is Reconcile Mode: Retell posts each call's real cost to Floe at call-end, so **every leg** (STT, TTS, telephony) lands on the same ledger — not just the LLM.

**Register the connection** (admin — dashboard, or the API with an admin dashboard session). Unlike Vapi, Floe does **not** mint a secret for you — Retell signs its webhooks with the API key **designated as the webhook key** in your Retell dashboard, so supply that exact key as the signing secret (any other Retell key fails verification):

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/developer/orchestrators \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin dashboard session>" \
  -d '{ "agentId": <your-agent-id>, "provider": "retell", "label": "support line", "secret": "<your designated Retell webhook key>" }'
```

The response returns the connection URLs:

```json
{
  "webhookUrl": "https://credit-api.floelabs.xyz/v1/webhooks/retell/call-end/<token>",
  "preCallUrl": "https://credit-api.floelabs.xyz/v1/webhooks/retell/pre-call/<token>"
}
```

In **Retell**:

- Paste the returned **`call-end`** URL into the **agent's webhook** (end-of-call events).
- Paste the returned **`pre-call`** URL into the **phone number's inbound webhook**.

Retell signs each delivery with the header **`x-retell-signature`**, in the format `v={ts},d={hex}` — where `{hex}` is the HMAC-SHA256 of `body + ts`, keyed by your Retell API key. Floe recomputes it and rejects a bad signature `401`; it also enforces a **±5-minute** timestamp window to block replays. An unknown or disabled token is `404`. Treat the URLs as secrets — rotate with `POST /v1/developer/orchestrators/:id/rotate`.

**Pre-call deny.** When the agent is over budget, Floe answers the inbound webhook with `{ "call_inbound": { "reject": true } }` and Retell denies the next inbound call **before it connects**. Without the pre-call URL, an over-budget agent is still stopped — just at its next Floe-keyed action (Step 3), not at admission.

**Verify** → end a call. A **reconciled debit** appears on the ledger within moments, attributed to the agent.

---

## Step 3 — Set a cap

Add a spend policy with the **kill-switch** action so a breach doesn't just decline one call — it suspends the agent.

- **Dashboard** → *Spend Controls* → add a policy (session or window cap) with action **Suspend agent**.
- **API** → set a policy with `"action": "suspend_agent"`. See [Spend Controls](../developers/spend-controls.md) for the policy shape and windows.

When the cap is crossed, the breaching call gets a `402` (carrying `"auto_suspended": true`) and **the whole agent is suspended — every subsequent call is rejected at authentication with `403`** until you resume it. A runaway campaign dies after call *N*, not call 10,000.

**Verify** → cross the cap → the next call is denied (`403` at admission, or the pre-call hook rejects the inbound call if you configured Step 2's `preCallUrl`).

---

## Your coverage score

The per-agent **coverage score** in the [dashboard](https://dev-dashboard.floelabs.xyz) shows the split — **% of spend pre-call enforceable vs post-call reconciled** — across every platform the agent runs on. With Step 1 you govern the LLM leg pre-call; Reconcile Mode (Step 2) puts the rest on the ledger and behind the circuit breaker. See [Coverage Score](../build/coverage-score.md).

To **raise** it, move more legs onto Floe rails — STT/TTS via [Floe Inference](../developers/keyless-inference.md), telephony via [Floe Phone](../developers/floe-phone.md). The full path is [Graduate to 100% coverage](../build/migrate-to-full-coverage.md).

---

{% hint style="info" %}
**The honest boundary.** Floe enforces **pre-call on the LLM leg** (the adapter through the gateway). STT, TTS, and telephony stay on Retell and are governed **post-call — reconciled onto the ledger, with a between-call circuit breaker** (`suspend_agent`). Floe does **not** intervene mid-call: enforcement is either *before* a call (deny the next inbound) or *after* it (reconcile + suspend). It never interrupts a call in progress — though the adapter itself will end a call gracefully when a turn breaches the per-call budget.
{% endhint %}

---

## Troubleshooting

| Symptom | Cause & fix |
|---|---|
| Webhook returns `401` | The `x-retell-signature` didn't verify. Confirm the connection's secret is **your current Retell API key** (Floe keys webhooks with it), and that your server clock is within the ±5-minute window. |
| Webhook returns `404` | The token in the URL is unknown or the connection is disabled. Re-copy the `call-end` / `pre-call` URLs from the connection. |
| Retell can't reach the custom LLM | The adapter isn't reachable at the agent's `llm_websocket_url`, or the path secret changed. Redeploy **and** update the agent's `llm_websocket_url` (or re-run `npm run setup`) — the URL written at setup carries the old secret. |
| LLM calls fail with `model_not_found` | Use the **fully-qualified** `provider/model` id (`openai/gpt-4o-mini`) — a bare `gpt-4o` is rejected. List valid ids with `GET /v1/models`. |
| Want to keep paying your own model vendor | Use **BYOK**: pass `X-Floe-Provider-Key: <your key>` in the adapter (or store it once). Floe meters and charges its service fee only. See [Floe Inference](../developers/keyless-inference.md). |
