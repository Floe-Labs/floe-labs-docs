---
icon: gauge
---

# Latency & overhead

Floe sits between your agent and the vendor, so the only latency question that matters is: **how much does Floe add** versus calling the vendor directly? We measure that on every production call and publish it here.

{% hint style="warning" %}
**Draft — pending measurement.** The numbers below are filled from production percentiles once real traffic has accrued. No placeholder or guessed number ships; the `__ ms` cells are intentional until they're real.
{% endhint %}

## Added latency (p50 / p99)

| Path | p50 added | p99 added |
|---|---|---|
| **Keyless LLM — streaming** (to first token) | `__ ms` | `__ ms` |
| Keyless LLM — non-streaming | `__ ms` | `__ ms` |
| x402 proxy — per paid call | `__ ms` | `__ ms` |

## What "added latency" means

Floe's overhead is the wall-clock time Floe adds **on the critical path before your agent gets the response** — excluding the upstream vendor/model call itself and any settlement that happens after the response is already flowing. It's the number an evaluator measures with a stopwatch:

```
Floe overhead = (time through Floe) − (time calling the vendor directly)
```

Per path, that is:

- **Keyless LLM (streaming):** gate + route + the pass-through of the first token. The model's own time-to-first-token is **upstream**, not Floe, and is excluded.
- **Keyless LLM (non-streaming):** gate + route + metering and debit before the response returns.
- **x402 proxy:** balance reserve + the EIP-3009 payment signing + the response hand-off. Persistence and settlement are deferred off the response path, so they don't count against you.

## How we measure it

- **Source:** production real-traffic percentiles, computed database-side over **every** recorded call in the window — not a sampled or synthetic benchmark.
- **Window / sample size / concurrency:** `__` _(filled at publish)_.
- Floe's added latency is recorded per call as `floe_overhead_ms`, separately from `upstream_latency_ms` (the vendor/model call itself).
- `upstream_latency_ms` is time-to-first-**byte** — it may precede the first content token when a provider emits an early SSE keep-alive or role delta — so it's a diagnostic, not the headline.

## Why it's low

One key, one hop. Floe's own work is arithmetic plus an in-memory affordability gate; nothing on the keyless path signs or waits on-chain. On the x402 proxy path the dominant cost is the payment-signing round-trip, which we continue to optimize.
