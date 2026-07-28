---
icon: gauge
---

# Latency & overhead

Floe sits between your agent and the vendor, so the only latency question that matters is: **how much does Floe add** versus calling the vendor directly? We measure that on every production call and publish it here.

{% hint style="info" %}
**Non-streaming keyless is measured and live.** Streaming (to first token) and x402-proxy percentiles are still pending their own measurement. Every number here comes from production percentiles over real traffic — no placeholder or guessed values — so the remaining `__ ms` cells stay empty until they're measured the same way.
{% endhint %}

## Added latency (p50 / p99)

| Path | p50 added | p99 added |
|---|---|---|
| **Keyless LLM — non-streaming** | **39 ms** | **181 ms** |
| Keyless LLM — streaming (to first token) | `__ ms` _(pending)_ | `__ ms` _(pending)_ |
| x402 proxy — per paid call | `__ ms` _(pending)_ | `__ ms` _(pending)_ |

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
- **Window / sample size:** the non-streaming keyless figures are `percentile_disc` (nearest-rank) over a rolling **1-hour window**, **n = 2,141** production calls, on the keyless (Floe-fronted) rail. Because `floe_overhead_ms` excludes the upstream call, the specific provider behind the keyless rail doesn't change what's measured. Streaming and x402-proxy percentiles are pending a dedicated measurement.
- Floe's added latency is recorded per call as `floe_overhead_ms`, separately from `upstream_latency_ms` (the vendor/model call itself).
- `upstream_latency_ms` is time-to-first-**byte** — it may precede the first content token when a provider emits an early SSE keep-alive or role delta — so it's a diagnostic, not the headline.

## Why it's low

One key, one hop. Floe's own work is arithmetic plus an in-memory affordability gate; nothing on the keyless path signs or waits on-chain. On the x402 proxy path the dominant cost is the payment-signing round-trip, which we continue to optimize.
