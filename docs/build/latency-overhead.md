---
icon: gauge
---

# Latency

Floe sits in the request path between your agent and its vendors: one key routes calls to the model, STT, TTS, and telephony providers you already use, with spend controls enforced before the request goes out.

This page covers Floe's own overhead only — the added time on top of the vendor call itself — plus how we measured it and where it sits relative to the rest of a voice agent's latency budget.

## Headline numbers

| Percentile | Overhead | What it means |
|---|---|---|
| p50 (median) | 38ms | Typical turn. Half of all calls come in under this. |
| p99 (tail) | ~180ms | Worst-case turn. 99 out of 100 calls come in under this. |

**Scope:** these figures measure only the routing, metering, and pre-transaction spend-control check Floe performs. They exclude:

- Model inference time
- STT/TTS synthesis time
- Telephony transport time
- Network time between your infra and the vendor

## Methodology

- **Metric:** `floe_overhead_ms` — wall-clock time added on the caller's critical path. Upstream provider latency is tracked separately as `upstream_latency_ms` and is not included. Asynchronous post-response settlement is also excluded, since it happens off the caller's critical path.
- **Instrumentation point:** measured inside the gateway across the path Floe owns — authenticate and gate the spend → resolve and route the model → stream the response → settle the debit.
- **Aggregation:** persisted per call on the request ledger (one row per settled call), aggregated with `percentile_disc` (nearest-rank) rather than interpolation.
- **Rail scope:** measured on the **keyless rail** — where Floe fronts the upstream provider from a pooled credential. The proxy, BYOK, and x402-router paths have different overhead profiles and are reported separately; mixing rails would blur the number. Because the metric excludes upstream latency, which provider Floe fronts on the keyless rail doesn't change what's being measured.
- **Window and sample:** rolling 1-hour window over live production traffic — keyless `/v1/chat/completions` calls, non-streaming. Two independent reads in the window: n=1,634 → p50 38ms / p99 166ms; n=2,141 → p50 39ms / p99 181ms. p50 is stable at 38–39ms; p99 varies within a 166–181ms band, reported as ~180ms.

This is a single-window snapshot on one rail, not a claim spanning every path through Floe. We'll widen the window and publish per-rail figures as volume grows on proxy, BYOK, and x402 traffic.

## Why p99, not just p50

Median latency describes the typical request. It says nothing about the tail — and in voice, the tail is where users notice. A slow turn once every hundred calls is exactly the failure mode that makes an otherwise-solid voice agent feel broken. We report p99 alongside p50 because a bounded, measured tail is what makes a gateway safe to stop thinking about.

<!-- PENDING SOURCES — do not publish until each figure has a citation.
     Removed from the rendered page because these are unverified third-party
     performance claims, which this page's own standard ("no guessed number
     ships") disallows. Restore with a source link per row.

## How this compares to other gateways

| Layer | Reported overhead | Basis |
|---|---|---|
| LiteLLM (proxy) | ~7.5ms | vendor-reported, mock upstream, median only |
| Helicone (edge) | ~8ms p50 | vendor-reported, mock upstream |
| Portkey | ~20–40ms | vendor + community-reported, real-world with routing/guardrails enabled |
| OpenRouter | ~40ms | vendor's own "typical production" figure |
| Floe (keyless rail) | 38ms p50 / ~180ms p99 | live production traffic, includes spend-control enforcement |

Floe's median lands in the same range as Portkey and OpenRouter once routing and controls are active — not the bare pass-through numbers from LiteLLM or Helicone, which don't enforce spend limits at all.
-->

## Where this fits in your total budget

Voice-infra teams generally target a **500–1,500ms voice-to-voice budget** (caller stops speaking → agent's audio starts) for a call that still feels conversational. That budget is spent mostly on:

| Stage | Typical latency |
|---|---|
| STT (streaming) | ~150ms |
| LLM response (time to first token, varies by model) | ~200–800ms+ |
| TTS (low-latency "flash"-class) | ~75–85ms |
| **Floe gateway overhead** | **38ms p50 / ~180ms p99** |

At p50, Floe's overhead is roughly 2.5–7.6% of a 500–1,500ms budget. At p99, it's a minority share even of the tightest 500ms target. Against the LLM leg alone, 38ms is small relative to the 200–800ms+ that leg typically takes on its own.

Human turn-taking gives useful context for why this budget exists at all: research on conversational timing across ten languages (Stivers et al., *PNAS*, 2009) found natural turn-transition gaps ranging from a few milliseconds up to roughly half a second depending on the language, with most languages' most common gap falling between 0 and 200ms. That's the reflex a voice agent is competing with — not an arbitrary UX target.

## Related

- [Spend controls](../developers/spend-controls.md) — what gets enforced pre-transaction and how
- [Vendor marketplace](../x402-directory/README.md) — endpoints Floe routes today
