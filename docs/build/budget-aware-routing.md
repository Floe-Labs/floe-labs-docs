# Budget-Aware Routing

{% hint style="warning" %}
**Early access.** Hard-stop at budget is live everywhere today. Budget-advisory headers (`X-Floe-Budget-Advisory`) let your agent taper itself. **Server-side auto-downgrade is in early access** — request it at [hello@floelabs.xyz](mailto:hello@floelabs.xyz).
{% endhint %}

When an agent nears its budget, Floe can act instead of failing — the job finishes, just cheaper. Instead of a hard `402` at the cap, you pick a behavior up front and Floe applies it as the agent runs.

| Mode | Behavior | Availability |
|------|----------|--------------|
| **Hard stop** | Suspend the agent and fire your webhook. | **Live** |
| **Advisory taper** | `X-Floe-Budget-Advisory` on each response lets your agent choose a cheaper model itself. | **Live** |
| **Downgrade** | Floe swaps to a cheaper model server-side and keeps going. | **Early access** |
| **Finish** | Complete the current task, then stop new spend. | **Early access** |

## Preflight: ask before you spend

Before a paid call, check the effective cap so the agent chooses a model it can afford — rather than discovering the limit by hitting it.

Project a batch of costs through policy with the forecast endpoint:

```bash
curl -X POST https://credit-api.floelabs.xyz/v1/x402/forecast \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "url": "https://api.example.com/v1/tts", "method": "POST", "count": 12 }
    ]
  }'
```

Pass the paid calls you're about to make as `items` (each with a `url`, optional `method`, and optional `count`). Floe runs the projected spend through your active policies — including value scaling and quality throttling — and returns the aggregated cost plus a per-policy preflight of any cap the plan would breach.

At runtime, the `X-Floe-Budget-Advisory` response header reports remaining headroom on the tightest effective cap (after value scaling and quality throttling). The agent reads it and picks a model before the next call. The header schema and how to branch on it are in the [Agent Runtime Contract](../developers/agent-runtime-contract.md#context-aware-spend-advisory) — forecast, enforcement, and the advisory header all report the same effective cap, so they can't drift.

## Quality-safe downgrades

A downgrade that tanks call quality isn't a saving — it's churn. Retried work, worse output, and a second bill.

Feed outcome signals back through the [Agent Runtime Contract](../developers/agent-runtime-contract.md#outcome-linked-spend-attribution): tag paid calls with `X-Floe-Action-Id`, then report `success` / `failure` / `partial` against that id when you know the result.

The outcome-quality throttle consumes those signals. It tightens spend only on work that isn't working, and relaxes back toward full spend when quality recovers — so a cheaper model that keeps performing keeps its budget, while one that degrades gets throttled. It reads your reports; Floe never judges quality itself. See [Spend Controls](../developers/spend-controls.md#outcome-quality-throttle-throttle-on-value-not-just-cost) for the cap and throttle reference, including the value-aware floor/ceiling bounds an operator sets around it.

## Open-source guardrail

[`floe-guard`](https://github.com/Floe-Labs/floe-guard) is a local, framework-agnostic hard-stop with no account required. It kills a runaway loop before it burns the bill — a drop-in in-process guard for Python or TypeScript.

Run it standalone when you have no Floe account yet, or alongside server-side Floe policies as a last-line local backstop. It exposes the same advisory shape as the hosted header, so taper logic you write against it ports unchanged when you move to the proxy.

## Next

Once routing decisions are made, every call — downgraded, finished, or stopped — lands in one place. See [Unified Billing & Ledger](unified-ledger.md).
