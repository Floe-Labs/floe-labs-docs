---
icon: python
---

# Python SDK

The `floe-agentkit-actions` package provides Coinbase AgentKit ActionProviders with **54 total actions** (30 in `FloeActionProvider` + 24 in `X402ActionProvider` — delegation, x402 payment, agent-awareness, merchant-allowlist, and Floe Inference) for Python 3.10+ environments.

> **Parity note.** The Python SDK has full parity with the TypeScript SDK: 30 Floe actions plus 24 X402 actions (54 total). The credit-facility actions (`instant_borrow`, `repay_and_reborrow`, `request_credit`, `manual_match_credit`, `check_credit_status`, `repay_credit`, `renew_credit_line`) belong to the **roadmap** on-chain credit product (self-custody) — not the live spend layer — and are present in both SDKs. The live spend-layer actions are the x402 payment + agent-awareness + spend-control actions.

> **Naming convention:** All action names and parameters in the Python SDK use **snake_case** (e.g., `borrow_amount`, `max_interest_rate_bps`). The TypeScript SDK uses camelCase for the same fields. Code examples are not interchangeable between SDKs without adjusting case.

## Installation

```bash
# Core package
pip install floe-agentkit-actions

# With CLI support
pip install floe-agentkit-actions[cli]

# With LangChain integration
pip install floe-agentkit-actions[langchain]
```

## Quick Start

### As an AgentKit Provider

```python
from coinbase_agentkit import AgentKit, AgentKitConfig
from floe_agentkit_actions import floe_action_provider

agentkit = AgentKit(AgentKitConfig(
    wallet_provider=wallet_provider,
    action_providers=[floe_action_provider()],
))
```

### Standalone Usage

Call actions directly without an AI framework:

```python
from floe_agentkit_actions import floe_action_provider

floe = floe_action_provider()
result = floe.get_price(wallet_provider, {
    "collateral_token": "0x4200000000000000000000000000000000000006",  # WETH
    "loan_token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",      # USDC
})
print(result)
```

## Framework Integrations

### LangChain

```python
from floe_agentkit_actions.integrations.langchain import get_floe_langchain_tools

tools = get_floe_langchain_tools(wallet_provider)
# Pass tools to a LangChain agent
```

### OpenAI Function Calling

```python
from floe_agentkit_actions.integrations.openai_agents import get_floe_openai_tools

tools = get_floe_openai_tools(wallet_provider)
# Pass tools to an OpenAI Agents SDK agent
```

## CLI: `floe-agent`

Interactive AI-powered DeFi agent with support for OpenAI, Claude, and Ollama, plus per-agent registration tooling.

```bash
# Install with CLI extras
pip install floe-agentkit-actions[cli]

# Default: interactive REPL
floe-agent

# Subcommands
floe-agent register --name <name>   # Provision an agent + mint a floe_* key
floe-agent agents                   # List registered agents
floe-agent use <name>               # Set the active agent
floe-agent rotate <name>            # Rotate the agent's API key
floe-agent revoke <name>            # Revoke the agent's API key
floe-agent open-credit-line --name <name> --deposit <usdc>   # Open the credit line
floe-agent run --agent <name>       # REPL scoped to a specific agent
```

### Subcommands

| Command | Purpose |
|---|---|
| `floe-agent run [--agent <name>]` | Interactive REPL. Default when no subcommand is given. Picks the agent from `--agent`, then `active_agent`, then the single registered agent if there's only one. |
| `floe-agent register --name <name>` | Provision a Floe agent (server-managed Privy wallet + on-chain delegation) and mint a `floe_*` key. Key is stored in OS keychain and printed once. Flags: `--borrow-limit <usdc>`, `--max-rate-bps <n>`, `--expiry-days <n>`, `--facilitator-url <url>`. |
| `floe-agent agents` | List registered agents and keychain status for each. |
| `floe-agent use <name>` | Set the active agent (persisted in `.floe-agent.json`). |
| `floe-agent rotate <name>` | Atomically rotate the agent's API key — old key revoked + new key minted server-side, keychain entry replaced. |
| `floe-agent revoke <name>` | Revoke the agent's API key server-side and remove the local keychain entry. |
| `floe-agent open-credit-line --name <name> --deposit <usdc>` | Open the USDC/USDC credit line for a previously-registered agent. Floe server-signs the borrow intent from the agent's Privy wallet (which must already hold the USDC deposit). Flags: `--max-ltv-bps <bps>` (1–9500, default 9500), `--max-rate-bps <bps>`. Required AFTER `register` before paid `/proxy/fetch` calls can succeed. |

### Setup flow (for `run`)

The REPL prompts for wallet provider, AI provider, and RPC URL. Configuration (wallet type + AI provider + agent registry, **not secrets**) is saved to `.floe-agent.json` and reused on subsequent runs. API keys live in the OS keychain via the [`keyring`](https://pypi.org/project/keyring/) package, or — when no keyring backend is available — in `FLOE_AGENT_KEY_<UPPER_NAME>` environment variables.

### Multi-agent registry

One developer can register up to five agents. Typical flow:

```bash
floe-agent register --name research --borrow-limit 5000
floe-agent register --name trading --borrow-limit 25000
floe-agent agents          # list both
floe-agent use trading     # mark trading as active
floe-agent run             # REPL connects as trading agent
floe-agent run --agent research  # override per session
```

### Example Session

> The lending/market interactions below are part of the **roadmap** on-chain credit product (self-custody), not the live spend layer. Rates shown are illustrative.

```
You: What markets are available?
  -> Lists all Floe lending markets with rates, LTV bounds

You: Post a lend intent for 100 USDC at my chosen rate
  -> Auto-approves USDC, posts the lending offer on-chain

You: Check the health of loan #42
  -> Shows current LTV, liquidation threshold, buffer percentage
```

## Wallet Providers

| Provider | Use Case |
|----------|----------|
| `EvmWalletProvider` | **Development / scripting** — raw private key |
| `CdpWalletProvider` | **Production agents** — MPC-managed via CDP API |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Wallet private key (0x...) |
| `CDP_API_KEY_NAME` | Coinbase CDP API key name |
| `CDP_API_KEY_PRIVATE_KEY` | Coinbase CDP API secret |
| `OPENAI_API_KEY` | OpenAI API key (for CLI) |
| `ANTHROPIC_API_KEY` | Anthropic API key (for CLI) |
| `BASE_RPC_URL` | Custom Base RPC URL (recommended) |

## Development

```bash
# Install in editable mode with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest
```

## Agent Awareness Actions (v0.3.0+)

The `X402ActionProvider` now includes 9 actions that let an agent reason about its own credit before committing capital. Configure `facilitator_api_key` to enable them:

```python
from floe_agentkit_actions import x402_action_provider, X402Config

x402 = x402_action_provider(X402Config(
    facilitator_url="https://credit-api.floelabs.xyz/v1",
    facilitator_api_key=os.environ["FLOE_AGENT_API_KEY"],  # floe_*
))
```

Action names: `get_credit_remaining`, `get_loan_state`, `get_spend_limit`, `set_spend_limit`, `clear_spend_limit`, `list_credit_thresholds`, `register_credit_threshold`, `delete_credit_threshold`, `estimate_x402_cost`. See [Agent Awareness](agent-awareness.md) for the decision-loop pattern.

## Source Code

GitHub: [Floe-Labs/agentkit-actions-py](https://github.com/Floe-Labs/agentkit-actions-py)
