# Floe Docs Rewrite — Voice-Operator ICP

**Author:** Product review for Alex
**Scope:** Restructure `floe-labs.gitbook.io/docs` so a Vapi/Retell/Bland/CrewAI voice operator lands, understands "one key for the whole voice bill," and ships a paid call in under 10 minutes.
**Assumed ground truth (per Alex):** everything is live except Twilio. LLM proxy, keyless inference, voice (Venice), search, browser, compute, spend controls, value-aware caps, quality throttle, budget-aware routing, `floe-guard`, `eve-floe` tapering — all GA.

If any of that is not actually GA, stop and fix the assumption before shipping the copy, because three pages below hard-assert it.

---

## 0. The one thing that's breaking trust right now

Your spend-controls page and homepage both carry a bolded callout that says Floe **cannot** see or cap LLM token spend paid with your own provider key. That directly contradicts "we see the whole bill." If the LLM proxy is GA, that callout is now **false** and must be rewritten everywhere it appears. Grep for these strings and kill/rewrite each:

- "They do **not** cap raw OpenAI/Anthropic LLM token bills"
- "those calls never touch Floe, so no Floe policy can see or stop them"
- "LLM token spend is governed only if you route it through Floe's LLM proxy ... feature-flagged"

Replace the scope note with the **Unified Ledger** callout in §3 below. This is priority zero — it's the keystone claim of the entire company and the docs currently refute it.

---

## 1. Information architecture change

### Current (organized by primitive — wrong for ICP)
```
Quickstart
Core Concepts → Wallet / Spend Controls / Onramp / x402 / Directory
Frameworks
Developers
Advanced (on-chain protocol, oracles, flash loans)  ← surfaced too early
Roadmap
Reference
```

### Proposed (organized by ICP + job-to-be-done)
```
Start Here
  ├─ For Voice Operators          ← NEW, top of nav, default landing
  ├─ Quickstart (5 min)           ← keep, demote below voice
  └─ Concepts in 90 seconds       ← NEW one-pager: key, proxy, ledger, caps

Build
  ├─ The Voice Stack              ← rewritten (see §2)
  ├─ Unified Billing & Ledger     ← NEW, promoted (see §3)
  ├─ Spend Controls               ← keep, re-lead (see §4)
  ├─ Budget-Aware Routing         ← NEW page, pulled out of spend-controls tail (see §5)
  └─ Frameworks (Vapi/Retell/CrewAI first, then generic)

Reference
  ├─ Vendor Marketplace (by category)
  ├─ Credit API / MCP / Webhooks / Error codes
  └─ ...

Advanced (opt-in, fenced)
  └─ Self-custody & On-chain Protocol   ← ALL oracle/flash-loan/LTV/solver content moves here
```

**Rule:** nothing about USDC, Base, Chainlink, Pyth, LTV, liquidation, or flash loans appears above the "Advanced" fold. A voice CFO reading "flash loans" next to "spend controls" is a churn risk. The onramp does the crypto conversion; the operator never needs to see the word USDC to fund a card and make a call.

---

## 2. NEW / REWRITTEN PAGE — `build/voice-stack.md`

The current Voice page lists **one** vendor (Venice) and marks Twilio/Deepgram "Coming soon." Your deck's hero shows ElevenLabs, Deepgram, Twilio as billed line items. Reconcile it. Below is paste-ready copy reflecting "all live except Twilio."

> ⚠️ **You must confirm the exact live endpoints per vendor.** I could not read the repo (GitHub blocks automated fetch). Fill the `PATH` / `PRICE` cells from source. Structure is correct; the cell values are yours to verify.

```markdown
# The Voice Stack

One Floe key pays for every leg of a voice conversation — telephony, speech-to-text,
LLM, and text-to-speech — and every leg lands in one ledger with one set of budget caps.

## What one conversation costs

A single inbound call touches four vendors. Here it is, costed end to end,
each leg paid through the same Floe proxy:

| Leg            | Vendor         | Typical cost | Status |
| -------------- | -------------- | ------------ | ------ |
| Telephony      | Twilio         | ~$0.003/min  | Coming soon |
| Speech-to-Text | Deepgram       | ~$0.004/min  | Live   |
| Reasoning      | LLM (any)      | ~$0.028/turn | Live   |
| Text-to-Speech | ElevenLabs     | ~$0.009/1k ch| Live   |
| **Total**      |                | **~$0.048**  |        |

> Verify each price/status against the marketplace before publish. Twilio is the only
> "Coming soon" — everything else is GA today.

## Run a full voice turn

Every leg is the same call shape: `POST /v1/proxy/fetch` with your one Floe key.
The response carries `X-Floe-Payment-Amount` so you see the cost of each leg.

### 1. Transcribe (Deepgram)
​```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "X-Floe-Task-Id: call-8842" \
  -H "Content-Type: application/json" \
  -d '{"url":"<DEEPGRAM_STT_ENDPOINT>","method":"POST","body":"..."}'
​```

### 2. Reason (LLM through Floe — one ledger)
​```bash
curl -X POST https://credit-api.floelabs.xyz/v1/llm/chat/completions \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "X-Floe-Task-Id: call-8842" \
  -H "Content-Type: application/json" \
  -d '{"model":"<MODEL>","messages":[{"role":"user","content":"..."}]}'
​```

### 3. Speak (ElevenLabs)
​```bash
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "X-Floe-Task-Id: call-8842" \
  -H "Content-Type: application/json" \
  -d '{"url":"<ELEVENLABS_TTS_ENDPOINT>","method":"POST","body":"..."}'
​```

All three legs share `X-Floe-Task-Id: call-8842`, so a single task budget caps the
**whole conversation** — not each vendor in isolation. That is the difference between
Floe and a token router: a router sees step 2. Floe sees 1, 2, and 3 on one bill.

## Live voice vendors

| Service    | Endpoints                     | Price   | Status      |
| ---------- | ----------------------------- | ------- | ----------- |
| ElevenLabs | Text to Speech                | metered | **Live**    |
| Deepgram   | Speech to Text                | metered | **Live**    |
| Venice AI  | TTS, Transcription            | metered | **Live**    |
| Twilio     | Telephony (SIP/PSTN)          | —       | Coming soon |

> Add every voice vendor that is actually live. If ElevenLabs and Deepgram are GA,
> they belong in this table today — their absence is the single biggest credibility
> gap between your deck and your docs.
```

**Why this page first:** it is literally slide 3 of your deck ("One conversation. 7 vendors. 7 machine payments.") turned into runnable code. Your deck already made the argument; the docs just have to honor it.

---

## 3. NEW PAGE — `build/unified-ledger.md`

This is the page that makes "we see the whole bill" true and kills the OpenRouter comparison.

```markdown
# Unified Billing & Ledger

A token router shows you your LLM spend. Floe shows you the whole bill — telephony,
speech, search, compute, and LLM — in one ledger, priced per call, capped by one policy set.

## Why this exists

A voice agent's cost is never just tokens. One conversation pays Twilio, Deepgram,
an LLM, and ElevenLabs. If four vendors bill four ways, you cannot answer the only
question that matters: **what did this call cost, and was it worth it?**

Floe answers it because every paid leg — x402 vendors via `/v1/proxy/fetch` and LLM
via `/v1/llm/chat/completions` — settles from the same balance and lands in the same
ledger, tagged by agent, task, and vendor.

## Route your LLM through Floe

Point your LLM calls at Floe's endpoint. Same request shape as OpenAI's Chat
Completions — only the host and key change:

​```bash
curl -X POST https://credit-api.floelabs.xyz/v1/llm/chat/completions \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"<MODEL>","messages":[{"role":"user","content":"Hello"}]}'
​```

Now LLM tokens, speech, and search all count against the same budgets, appear in the
same analytics, and feed the same per-agent cost history.

## One task, one budget, every vendor

Tag every leg of a job with `X-Floe-Task-Id`. The task budget caps the sum across
all vendors — telephony + STT + LLM + TTS — not each in isolation. See Spend Controls.

## Keyless inference

You can also call LLM and voice models with no vendor account at all — Floe holds the
upstream relationship and bills you per call. See Floe Inference (Keyless LLM & Voice).
```

> Confirm the keyless-inference endpoint/model list from `developers/keyless-inference.md`
> — I could not read that page. The claim "keyless is live" is yours; the copy assumes it.

---

## 4. REWRITE the lead of `build/spend-controls.md`

Keep the whole API reference — it's genuinely strong (value-aware caps, quality throttle, kill-switch are real differentiators). Two changes:

**(a) Replace the scope callout.** Delete the "we do NOT cap LLM" box. Replace with:

```markdown
> **Scope: one ledger, one policy set.** Spend controls cap every paid call Floe
> settles — x402 vendors through `/v1/proxy/fetch` **and** LLM through
> `/v1/llm/chat/completions`. Route both through Floe and a single task or session
> budget bounds the entire conversation cost across every vendor. (Calls you make
> directly to a provider with your own key, bypassing Floe, are the one thing Floe
> can't see — so route them through Floe.)
```

**(b) Move value-aware caps and the quality throttle OUT.** They're buried at the bottom under generic headers. They are your "agents get smarter about their own spend" moat. Pull them into the new Budget-Aware Routing page (§5) and leave a one-line pointer.

---

## 5. NEW PAGE — `build/budget-aware-routing.md`

Your deck's Wedge slide labels "Budget-aware routing" as **the** differentiator ("Downgrade / Finish the job / Hard stop"). Your GitHub confirms `eve-floe` does "budget-aware tapering." There is no doc page teaching it. Build one.

```markdown
# Budget-Aware Routing

When an agent nears its budget, Floe acts instead of failing — the job finishes,
just cheaper. Three behaviors, operator-controlled:

| Mode         | Behavior                                                  |
| ------------ | -------------------------------------------------------- |
| Downgrade    | Swap to a cheaper model mid-task and keep going.         |
| Finish       | Complete the current task, then stop new spend.          |
| Hard stop    | Suspend the agent and fire your webhook.                 |

## Preflight: ask before you spend

Before a paid call, check the effective cap with `/forecast`. The response's
`X-Floe-Budget-Advisory` header reports remaining headroom on the effective cap
(after value scaling and quality throttling). Your agent reads it and picks a model.

## Quality-safe downgrades

A downgrade that tanks call quality isn't a saving — it's churn. Feed outcome signals
back with the runtime contract; the outcome-quality throttle tightens spend only on
work that isn't working, and relaxes when quality recovers. [link: runtime contract]

## Open-source guardrail

`floe-guard` is a local, framework-agnostic hard-stop you can drop in with no account —
it kills a runaway loop before it burns your bill. Use it standalone or alongside
server-side Floe policies. [link: github.com/Floe-Labs/floe-guard]
```

> Confirm `/forecast` and `X-Floe-Budget-Advisory` behave as described — they're
> referenced in your live spend-controls page, so this is low-risk, but verify.

---

## 6. Frameworks — reorder for the ICP

Your framework list leads with AgentKit/LangChain/generic. Your ICP is Vapi, Retell, Bland, CrewAI. Reorder and add the two that matter:

1. **Vapi** — how to route a Vapi assistant's vendor spend through one Floe key (NEW; this is your Q3 billing partner, it needs a page).
2. **CrewAI** — "buyer agent" is your named design partner; make the CrewAI page a voice-buyer example, not generic.
3. Retell / Bland — even a stub with the proxy pattern beats absence.
4. Then AgentKit, LangChain, Vercel AI, OpenAI, MCP as the generic tail.

If Vapi billing isn't live until Q3, mark it "Preview" — but get the page up now so the operator who saw your deck finds something.

---

## 7. Delete-or-fence list (crypto noise above the fold)

Move every one of these under **Advanced → Self-custody & Protocol**. None belong in the default voice-operator path:

- Intent-based matching / orderbook / solver bots
- Dual-oracle (Chainlink/Pyth) / circuit breakers
- Flash loans / 95% LTV / liquidation / WETH-cbBTC collateral
- DefiLlama TVL references
- "Send USDC on Base from any wallet" as a primary funding path (keep card/Apple Pay/Google Pay primary; USDC-on-Base becomes a secondary note)

The homepage's "No crypto required" line is undercut three sentences later by "Buy USDC / send USDC on Base." Fix: onramp copy says "Fund with a card, Apple Pay, Google Pay, or bank — Floe handles the rest." No USDC in the first screen.

---

## 8. Numbers to stop using until verified

- **"2,000+ vendor API services."** If the voice-relevant live set is ~4 vendors, this number invites the vaporware read the moment someone opens the voice page. Either (a) show the true live-voice count loudly ("3 voice vendors live, more weekly") and let 2,000+ describe the long-tail x402 directory separately, or (b) drop the headline number until category pages substantiate it. Undersell, be correct.

---

## Priority order (ship in this sequence)

1. **Kill the "Floe can't see LLM" callout** everywhere. Replace with Unified Ledger note. *(1 hour, keystone.)*
2. **Rewrite the Voice Stack page** with ElevenLabs + Deepgram marked Live and the end-to-end costed call. *(pure content.)*
3. **Ship Unified Billing & Ledger page.** *(makes the whole-bill claim true.)*
4. **Pull Budget-Aware Routing into its own page.** *(surfaces the moat.)*
5. **Reorder frameworks, add Vapi + CrewAI voice examples.**
6. **Fence the crypto/on-chain material under Advanced.**
7. **Reconcile the 2,000+ number.**

Items 1–4 are the difference between docs that describe your deck and docs that describe your GitBook. Do those four this week.
```
