# MCP/Agent Integration

Connect AI agents to Floe using the Model Context Protocol (MCP).

## Overview

Floe provides an MCP server that enables AI agents to:
- Query market data and loan status
- Create and sign intents
- Manage loan positions
- Monitor health and execute repayments

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AI Agent   │────▶│ MCP Server  │────▶│    Floe     │
│  (Claude,   │     │  (Lendr)    │     │  Protocol   │
│   GPT, etc) │◀────│             │◀────│             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## MCP Server Setup

### Installation

```bash
npm install @floe/mcp-server

# Or run directly
npx @floe/mcp-server
```

### Configuration

```json
{
  "mcpServers": {
    "floe": {
      "command": "npx",
      "args": ["@floe/mcp-server"],
      "env": {
        "FLOE_RPC_URL": "https://mainnet.base.org",
        "FLOE_CONTRACT": "0x17946cD3e180f82e632805e5549EC913330Bb175"
      }
    }
  }
}
```

## Resources

MCP resources expose Floe data:

### Markets

```typescript
// Resource: floe://markets
{
  "type": "floe/markets",
  "data": {
    "markets": [
      {
        "id": "0x...",
        "loanToken": "USDC",
        "collateralToken": "WETH",
        "defaultRate": 500,
        "defaultLtv": 8000
      }
    ]
  }
}
```

### Positions

```typescript
// Resource: floe://positions/{address}
{
  "type": "floe/positions",
  "data": {
    "loans": [
      {
        "loanId": 1,
        "role": "borrower",
        "principal": "5000000000",
        "collateral": "2500000000000000000",
        "currentLtv": 6500,
        "healthFactor": 1.23
      }
    ],
    "intents": [...]
  }
}
```

## Tools

MCP tools enable agent actions:

### intent.create

Create a new lend or borrow intent:

```typescript
{
  "name": "intent.create",
  "description": "Create a lending or borrowing intent",
  "inputSchema": {
    "type": "object",
    "properties": {
      "intentType": {
        "type": "string",
        "enum": ["lend", "borrow"]
      },
      "amount": {
        "type": "string",
        "description": "Amount in human-readable format (e.g., '5000 USDC')"
      },
      "rate": {
        "type": "number",
        "description": "Interest rate as percentage (e.g., 5 for 5%)"
      },
      "duration": {
        "type": "string",
        "description": "Duration (e.g., '30 days')"
      },
      "collateral": {
        "type": "string",
        "description": "For borrow: collateral amount (e.g., '2.5 ETH')"
      }
    },
    "required": ["intentType", "amount", "rate", "duration"]
  }
}
```

### loan.repay

Repay an active loan:

```typescript
{
  "name": "loan.repay",
  "description": "Repay part or all of a loan",
  "inputSchema": {
    "type": "object",
    "properties": {
      "loanId": { "type": "number" },
      "amount": {
        "type": "string",
        "description": "Amount to repay (or 'full' for complete repayment)"
      }
    },
    "required": ["loanId", "amount"]
  }
}
```

### position.topup

Add collateral to a loan:

```typescript
{
  "name": "position.topup",
  "description": "Add collateral to improve loan health",
  "inputSchema": {
    "type": "object",
    "properties": {
      "loanId": { "type": "number" },
      "amount": {
        "type": "string",
        "description": "Collateral to add (e.g., '0.5 ETH')"
      }
    },
    "required": ["loanId", "amount"]
  }
}
```

### market.query

Get market information:

```typescript
{
  "name": "market.query",
  "description": "Query market data and statistics",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Natural language query about markets"
      }
    },
    "required": ["query"]
  }
}
```

## Authentication

Agents authenticate using:

### Sign-In with Ethereum (SiWE)

```typescript
// Agent requests user to sign SiWE message
const siweMessage = {
  domain: "app.floelabs.xyz",
  address: userAddress,
  statement: "Sign in to Floe via AI agent",
  uri: "https://app.floelabs.xyz",
  version: "1",
  chainId: 8453,
  nonce: generateNonce()
};
```

### ERC-1271 (Smart Contract Wallets)

For DAOs and multisigs:

```typescript
// Agent prepares transaction for multisig approval
const preparedTx = await mcpServer.prepareTransaction({
  tool: "loan.repay",
  params: { loanId: 1, amount: "full" }
});

// Multisig signs and executes
await safeWallet.execTransaction(preparedTx);
```

## Natural Language Examples

### Borrowing Flow

**User**: "Borrow 20k USDC for 90 days against 15 ETH, max 5% APR"

**Agent Actions**:
1. Parse intent: `{ type: "borrow", amount: "20000", collateral: "15", rate: 5, duration: 90 }`
2. Call `intent.create` tool
3. Request user signature
4. Submit intent on-chain
5. Monitor for match
6. Report loan creation

### Monitoring Flow

**User**: "Check my loan health"

**Agent Actions**:
1. Fetch `floe://positions/{address}` resource
2. Calculate health factors
3. Report status:
   - "Loan #1: 65% LTV, healthy (liquidation at 80%)"
   - "Loan #2: 77% LTV, add 0.5 ETH to be safe"

### Repayment Flow

**User**: "Repay my loan"

**Agent Actions**:
1. Identify active loans
2. Calculate total owed (principal + interest)
3. Call `loan.repay` with amount
4. Request signature
5. Submit transaction
6. Confirm completion

## Elicitation

When the agent needs more information:

```typescript
// Tool returns elicitation request
{
  "status": "elicitation_required",
  "prompt": {
    "question": "Which loan would you like to repay?",
    "options": [
      { "label": "Loan #1 (5000 USDC)", "value": 1 },
      { "label": "Loan #2 (3000 USDC)", "value": 2 }
    ]
  }
}

// Agent presents options to user
// User selects, agent continues
```

## Error Handling

```typescript
// Tool error response
{
  "status": "error",
  "code": "INSUFFICIENT_BALANCE",
  "message": "Wallet has 4500 USDC, need 5000 USDC for repayment",
  "suggestion": "Reduce repayment amount or add funds"
}
```

## Security Considerations

1. **Transaction Signing**: All transactions require user signature
2. **Amount Limits**: Configurable per-session limits
3. **Confirmation Prompts**: High-value actions require confirmation
4. **Audit Trail**: All agent actions logged

## Integration Examples

### Claude Desktop

```json
{
  "mcpServers": {
    "floe": {
      "command": "npx",
      "args": ["@floe/mcp-server"]
    }
  }
}
```

### Custom Agent

```typescript
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["@floe/mcp-server"]
});

const client = new Client({ name: "my-agent", version: "1.0.0" });
await client.connect(transport);

// Use tools
const result = await client.callTool("market.query", {
  query: "What's the current ETH price?"
});
```

## Lendr AI

Lendr is Floe's official AI assistant built on this MCP integration:

- Available at [app.floelabs.xyz](https://app.floelabs.xyz)
- Natural language lending interface
- Loan monitoring and alerts
- Protocol education

See [Using Lendr AI](../user/lendr-ai.md) for user documentation.
