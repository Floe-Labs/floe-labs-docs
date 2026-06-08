---
icon: users
---

# CrewAI `Beta`

One Floe credit line caps **everything your crew spends** — paid tool calls *and* LLM tokens — behind a hard, server-side ceiling. The agent can never spend past it, no matter what the model decides to do.

> Your 3 AM infinite loop dies at **$1**, not $414.

CrewAI's most common production complaint is a runaway agentic loop quietly burning through tokens until you notice the bill. `crewai-floe` puts a real dollar ceiling around the whole crew. The cap is enforced by the Floe facilitator, not by the agent — so a confused or adversarial model can't talk its way past it. When you enable an allowlist, the agent can also only pay vendors you've named.

## Install

{% tabs %}
{% tab title="Standalone package" %}
```bash
pip install crewai-floe
```
{% endtab %}
{% tab title="Via floe-agentkit-actions" %}
```bash
pip install "floe-agentkit-actions[crewai]"
```
The same surface is available under `floe_agentkit_actions.integrations.crewai`.
{% endtab %}
{% endtabs %}

You'll need a Floe API key from [dev-dashboard.floelabs.xyz](https://dev-dashboard.floelabs.xyz) and a wallet provider (see [Agent Quickstart](../agents/quickstart-agents.md)).

## Quickstart

`budget_enabled_agent()` provisions a credit line, wires in Floe's payment tools, and returns a **plain `crewai.Agent`** — no subclass, nothing that breaks when CrewAI bumps versions.

```python
from crewai import Crew, Task
from crewai_floe import budget_enabled_agent, FloeBudget, Floe402Tool

researcher = budget_enabled_agent(
    role="Market Researcher",
    goal="Pull pricing data from paid APIs and summarize it",
    budget=FloeBudget(usd_limit=5),          # hard ceiling for this agent
    wallet_provider=wallet_provider,
    provider_key=OPENAI_API_KEY,             # your key, pass-through only
    tools=[Floe402Tool(url="https://api.somevendor.com/quote")],
)

crew = Crew(agents=[researcher], tasks=[Task(
    description="Get the latest quote and summarize it",
    expected_output="A one-paragraph summary",
    agent=researcher,
)])

crew.kickoff()
```

The crew spends real USDC against the Floe credit line — but never more than `$5`, total, across every tool call and every token.

### Paying for tools — `Floe402Tool`

`Floe402Tool(url=...)` is a `crewai.tools.BaseTool` that calls any of the 13,000+ [x402](../developers/x402-facilitator.md) endpoints Floe can reach. Each call routes through the Floe facilitator, which auto-borrows USDC against your credit line, signs the EIP-3009 payment, and returns the response.

```python
from crewai_floe import Floe402Tool

quote_tool = Floe402Tool(url="https://api.somevendor.com/quote")
```

No API key on the tool, no USDC in the agent's hands. The agent never signs a transaction or pays gas.

### Paying for LLM tokens — `FloeLLM`

`FloeLLM` is a thin `crewai.LLM` that routes model calls through Floe so token spend is debited from the **same** credit line as your tool calls. That's how one ceiling covers both planes.

```python
from crewai_floe import FloeLLM

llm = FloeLLM(
    model="openai/gpt-4o",
    proxy_base_url="https://credit-api.floelabs.xyz/v1/llm",
    credit_key=FLOE_API_KEY,     # authenticates + identifies the credit line
    provider_key=OPENAI_API_KEY, # pass-through to OpenAI, never persisted
)

agent = budget_enabled_agent(
    role="Analyst", goal="...", budget=FloeBudget(usd_limit=5),
    wallet_provider=wallet_provider, llm=llm,
)
```

If you don't pass `llm`, `budget_enabled_agent()` builds one for you from `provider_key`.

## Merchant allowlist (opt-in)

By default, the agent can pay **any** vendor — no enumeration, no setup. This keeps onboarding frictionless.

Supplying `allow={...}` flips the agent to **default-deny**: it may only pay the hosts and payees you list, each with its own sub-cap. Enforcement is **server-side at two points**:

- **Host check (pre-fetch):** before Floe fetches the URL, the destination host must be on the list, or the request fails `403 host_not_allowlisted`.
- **Payee check (post-402, pre-sign):** after the merchant returns its payment requirement, the actual payee address must be on the list, or Floe refuses to sign — `403 vendor_not_allowlisted`. This blocks the "allowlisted host redirects payment to an attacker" attack.

```python
budget = FloeBudget(
    usd_limit=5,
    allow={
        "api.openai.com": "$2",        # at most $2 to this host/payee
        "api.somevendor.com": "$1",
    },
)
```

Both checks run inside the Floe facilitator, so they hold even if a tool is misconfigured or bypassed on the client. `allow=None` (the default) means allow-any.

## LLM cost control

The runaway-loop problem lives in the **LLM plane**. Floe brings it under the credit-line ceiling two ways — and the boundary between them is worth stating plainly.

**Path A — x402-native LLMs (zero extra infra, today).**
Some model providers (e.g. Venice) are already x402 vendors. Calls to them are just paid tool calls, so every Floe control — the credit-line ceiling, the allowlist, spend limits — governs them with **nothing extra to run**. The honest caveat: the x402-native models available today are open-weight models (Llama, Qwen, etc.), not GPT-4o or Claude.

**Path B — GPT-4o / Claude via the metered proxy.**
For the closed frontier models, route through the Floe-metered LiteLLM proxy (`FloeLLM` above). It:

- Checks credit-line headroom **before** each call. If the ceiling is reached, it refuses (`402` / `429`), the `crewai.LLM.call()` raises, and **the crew halts.** This is the actual kill-switch.
- Meters token usage **after** each call and debits the credit line — the same USDC envelope as tools, so one ceiling covers both.
- Prices at **provider cost** (from the LiteLLM cost map) plus roughly a **5% safety buffer**. At-cost — Floe takes no margin on tokens.
- Treats your `provider_key` as **pass-through**: it's supplied per request, used to call the provider, and **never persisted**. Floe holds no provider keys.

So: open models get a hard cap today with zero new infra; GPT-4o and Claude get a hard cap through the proxy. Either way the dollar ceiling is real and server-enforced.

## Budget awareness

Beyond the hard cap, a crew can *see* how much room it has left and plan accordingly:

- **`X-Floe-Budget-Advisory` header** — every paid response carries the tightest current cap's remaining headroom and utilization.
- **`floe_budget_status` tool** — added automatically when `budget_aware=True`; lets an agent query its remaining budget mid-run.
- **Budget-aware backstory** — `budget_enabled_agent(budget_aware=True)` injects instructions telling the agent to taper work and finish within budget.

```python
agent = budget_enabled_agent(
    role="Analyst", goal="...",
    budget=FloeBudget(usd_limit=5),
    wallet_provider=wallet_provider,
    provider_key=OPENAI_API_KEY,
    budget_aware=True,   # adds floe_budget_status + budget-aware backstory
)
```

**This is a soft signal.** LLMs honor it unreliably — a model can ignore its own backstory. Budget awareness is upside for cleaner planning; the **hard cap is the real protection**. Don't rely on the advisory to stop a loop. Rely on the ceiling.

## Demos

Two runnable crews live in [`floe-examples/crewai-demo`](https://github.com/Floe-Labs/floe-examples/tree/main/crewai-demo):

- **`loop_kill.py`** — the headline. A crew rigged to infinite-loop on GPT/Claude through the metered proxy with `FloeBudget(usd_limit=1)`. Without Floe it would burn money until you noticed; with Floe the proxy refuses past `$1` and the crew stops dead. It prints total spend at the halt.
- **`procurement_crew.py`** — a Researcher → Buyer → Manager crew with an allowlist. The Buyer tries an off-allowlist host (hard-stopped with `host_not_allowlisted`) and tries to overspend its sub-cap (hard-stopped). The per-agent spend ledger is printed at the end.

Both demos and their environment setup are documented in the example's `README.md`.
