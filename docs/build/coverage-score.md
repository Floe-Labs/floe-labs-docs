---
icon: gauge
---

# Coverage Score

Every agent in your [dashboard](https://dev-dashboard.floelabs.xyz) carries a **Coverage Score**: the percentage of that agent's known spend Floe can act on, split three ways. The fleet-wide roll-up across every agent you own has its own screen — **Coverage** in the sidebar, at [dev-dashboard.floelabs.xyz/coverage](https://dev-dashboard.floelabs.xyz/coverage).

| Bucket | Meaning | Example |
|---|---|---|
| **Enforceable** | The leg runs through Floe's path. Request legs (LLM turns, one-shot TTS) are gated **pre-call**; Floe-native **duration-billed** legs (streaming STT, Floe Phone minutes) are metered **live** and cut off at the cap. | Model calls via the custom-LLM slot; STT/TTS on Floe keys; Floe Phone minutes. |
| **Reconciled** | The cost reaches the ledger at call-end via Reconcile Mode; the circuit breaker acts on the *next* admission. | A Vapi call's cost ingested from the end-of-call webhook. |
| **Dark** | Spend Floe never sees. It counts against nothing and appears nowhere. | A vendor billed on its own account, with no webhook and no Floe key. |

**Coverage = (enforceable + reconciled) ÷ total known spend.** Dark spend is the known-unknown: legs you've told Floe exist but that never report. Spend on vendors Floe has never heard of can't be counted at all — the score is honest about what it can't see.

## Why no platform can compute this

Vapi sees Vapi spend. Retell sees Retell's. On BYOK, platforms report provider costs as $0 because that spend sits on your own vendor bills. The Coverage Score spans **every** execution path an agent uses — which is only computable from a neutral ledger outside all of them.

## How to raise it

The score tells you which leg to move. In order of typical impact:

1. **Connect the end-of-call webhook** ([setup](../developers/webhooks.md#connect-your-orchestrator-reconcile-mode)) — moves in-call platform legs from *dark* to *reconciled* in one paste.
2. **Point the custom-LLM slot at Floe** ([Vapi](../platforms/vapi.md) · [Retell](../platforms/retell.md) · [Bland](../platforms/bland.md)) — moves the model leg (~40% of a cascade bill, ~60%+ realtime) from *reconciled* to *enforceable*.
3. **Move telephony to [Floe Phone](../developers/floe-phone.md)** — enforceable minutes on the same ledger.
4. **STT/TTS via Floe** *(early access — request at [hello@floefinance.com](mailto:hello@floefinance.com))*.

For spend Floe never routes at all — **BYOK** LLM calls, self-hosted models, off-path tools — routing isn't an option yet, so it stays *dark*. [Ledger sync](ledger-sync.md) pushes `floe-guard`'s local spend ledger to Reconcile Mode, moving that spend from *dark* to *reconciled* so the score counts it (budget only — it moves no balance).

## Reading the tile

The dashboard shows the score on the agent overview and, rolled up across every agent, on the account home. When the window is empty the tile tells you *why*. The rules are checked in this order — first match wins:

1. **A score** — any spend in the window. On a keyless agent that is **"Coverage: 100%"**: every dollar is gateway-routed and enforceable (pre-call on request legs, live on Floe-native duration-billed legs). This is the ceiling, not an error.
2. **"Coverage: 100%" by call count** — no spend yet, but Floe-routed calls landed at $0 (free-tier models, or BYOK on a $0 service fee). Every call went through Floe's gate; the money score renders with the first metered call.
3. **"Computing"** — nothing metered yet, but the account routes on its own vendor keys (BYOK), or an end-of-call webhook is connected and the first call-end hasn't landed.
4. **"No coverage score yet"** — no spend, no routed calls, no BYOK, no webhook. Floe only sees spend you route through it. **Connect webhook (2 min) →** opens the agent's Voice orchestrators card; the score computes from the next call.

So a keyless agent with routed calls never sees "No coverage score yet" — rules 1–2 win. The account tile uses the same rules across the whole fleet; its **Connect webhook** button takes you to the first agent that has no webhook yet.

## API

```http
GET /v1/developer/agents/:agentId/coverage?days=30
```

Returns `totals` — `knownRaw`, `enforceableRaw`, `reconciledRaw` (raw USDC) plus `coverageBps` (the enforceable-plus-reconciled share in basis points; `null` when there's no spend in the window) — a `bySource` breakdown (`class`, `calls`, `costRaw`), a daily `series`, `calls`, and `dark: "unknown"` (spend on platforms never wired to Floe can't be counted).

`calls` counts the same rows `totals` sums: `total`, `enforceable`, `reconciled`, `byok`. `enforceable` and `reconciled` are mutually exclusive and sum to `total`; `byok` is a **subset of `enforceable`** (gateway calls served on your own vendor key — rail `byok`) and never overlaps `reconciled` (spend pushed by [ledger sync](ledger-sync.md) lands as reconciled rows, not `byok`). Don't add `byok` to the other two.

**Zero-spend windows:** `coverageBps` is `null` whenever `knownRaw` is `0`, even if calls landed at $0. Clients should read `calls.*` in that case — `calls.enforceable > 0 && calls.reconciled == 0` is what the dashboard renders as "Coverage: 100%" by call count; `calls.total == 0` is genuinely no activity. `null` never means "0% covered". Accepts any developer credential — a `floe_live_…` key, a dashboard session, or a wallet-signature header set.

## The honest boundary

On calls Floe doesn't run — the orchestrator owns the media path — enforcement is **admission control, never mid-call**: an over-budget request is refused *before* it starts, and a reconciled breach denies the **next** admission (the next inbound call on Vapi/Retell **when a pre-call URL is configured**; otherwise the agent's next Floe-keyed action — always the case on Bland, which has no pre-call hook; a cooperative pre-call check on self-hosted stacks). The one exception is **Floe-native duration-billed legs** — streaming STT and Floe Phone run through Floe's own path and are metered live, cut off mid-stream at the cap. The score exists so that boundary is **visible instead of implied**.

> Pre-call where we're in the path. Circuit breaker everywhere else.
