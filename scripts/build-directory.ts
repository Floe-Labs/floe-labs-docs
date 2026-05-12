import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENTRIES_DIR = join(__dirname, '..', 'x402-directory', 'entries');
const OUTPUT_DIR = join(__dirname, '..', 'docs', 'x402-directory');
const MANIFEST_PATH = join(__dirname, '..', 'x402-directory', 'directory.json');

interface Entry {
  id: string; name: string; provider: string; homepage?: string;
  description: string; resource: string; method: string; category: string;
  tags?: string[]; x402Version: number; network: string; asset: string;
  priceUsd: string; pricingModel: string; floeCompatible: boolean; status: string;
}

const CATEGORY_META: Record<string, { title: string; icon: string; description: string }> = {
  'web-search': { title: 'Web Search & Scraping', icon: 'globe', description: 'Web search, scraping, and data extraction.' },
  'social-news': { title: 'Social & News', icon: 'newspaper', description: 'Social media data, news signals, and content.' },
  'crypto-data': { title: 'Crypto Data & Analytics', icon: 'chart-line', description: 'On-chain analytics, prices, wallet intelligence.' },
  'risk-security': { title: 'Risk & Security', icon: 'shield', description: 'Token scanning, honeypot detection, risk assessment.' },
  'llm-inference': { title: 'LLM Inference', icon: 'brain', description: 'AI model inference — Claude, GPT, open-source models.' },
  'media-generation': { title: 'Media Generation', icon: 'image', description: 'Image, video, audio, and music generation.' },
  'browser-compute': { title: 'Browser & Compute', icon: 'desktop', description: 'Headless browsers, proxies, and compute.' },
  'storage': { title: 'Storage', icon: 'database', description: 'IPFS, Arweave, and agent memory.' },
  'identity-reputation': { title: 'Identity & Reputation', icon: 'fingerprint', description: 'Attestations, identity, and trust scores.' },
  'payments-commerce': { title: 'Payments & Commerce', icon: 'credit-card', description: 'Gift cards, merchant payments, fiat rails.' },
  'infra-gateway': { title: 'Infrastructure & Gateways', icon: 'server', description: 'RPC, CDN, and infrastructure APIs.' },
  'agent-tooling': { title: 'Agent Tooling', icon: 'wrench', description: 'MCP servers, workflows, and agent orchestration.' },
};

// Read and validate all entries
const files = readdirSync(ENTRIES_DIR).filter(f => f.endsWith('.json'));
const validCategories = new Set(Object.keys(CATEGORY_META));
const entries: Entry[] = [];
let errors = 0;

for (const f of files) {
  try {
    const entry: Entry = JSON.parse(readFileSync(join(ENTRIES_DIR, f), 'utf-8'));
    if (!entry.id || !entry.name || !entry.resource || !entry.category) {
      console.error(`  ERROR: ${f} missing required fields (id, name, resource, or category)`);
      errors++;
      continue;
    }
    if (!validCategories.has(entry.category)) {
      console.error(`  ERROR: ${f} has unknown category "${entry.category}". Valid: ${[...validCategories].join(', ')}`);
      errors++;
      continue;
    }
    entries.push(entry);
  } catch (err) {
    console.error(`  ERROR: ${f} — ${(err as Error).message}`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n${errors} entry error(s) found. Fix them before generating.`);
  process.exit(1);
}
console.log(`Read ${entries.length} entries (0 errors)`);

// Group by category
const grouped: Record<string, Entry[]> = {};
for (const entry of entries) {
  if (!grouped[entry.category]) grouped[entry.category] = [];
  grouped[entry.category].push(entry);
}

// Sort entries within each category by name
for (const cat of Object.keys(grouped)) {
  grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
}

mkdirSync(OUTPUT_DIR, { recursive: true });

// Generate category pages
for (const [category, catEntries] of Object.entries(grouped)) {
  const meta = CATEGORY_META[category] || { title: category, icon: 'folder', description: '' };

  let md = `---\nicon: ${meta.icon}\n---\n\n# ${meta.title}\n\n`;
  md += `${meta.description} All payable with Floe credit on Base.\n\n`;
  md += `| API | Provider | Price | Method | Status |\n`;
  md += `|-----|----------|-------|--------|--------|\n`;

  for (const e of catEntries) {
    const statusBadge = e.status === 'verified' ? 'Verified' : e.status === 'preview' ? 'Preview' : e.status;
    md += `| ${e.name} | ${e.provider} | $${e.priceUsd} | ${e.method} | ${statusBadge} |\n`;
  }

  md += '\n---\n\n';

  for (const e of catEntries) {
    md += `## ${e.name}\n\n`;
    if (e.homepage) md += `**Provider:** [${e.provider}](${e.homepage})\n`;
    else md += `**Provider:** ${e.provider}\n`;
    md += `**Endpoint:** \`${e.method} ${e.resource}\`\n`;
    const pricingSuffix = e.pricingModel === 'dynamic' ? ' (dynamic)' : e.pricingModel === 'tiered' ? ' (tiered)' : '';
    md += `**Price:** $${e.priceUsd} ${e.asset} per call${pricingSuffix} · Base mainnet · x402 v${e.x402Version}\n`;
    md += `**Floe compatible:** ${e.floeCompatible ? 'Yes' : 'No'}\n\n`;
    md += `> ${e.description}\n\n`;

    md += '```bash\n';
    md += `# Call through Floe\n`;
    md += `curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \\\n`;
    md += `  -H "Authorization: Bearer $FLOE_API_KEY" \\\n`;
    md += `  -H "Content-Type: application/json" \\\n`;
    md += `  -d '{"url": "${e.resource}", "method": "${e.method}"}'\n`;
    md += '```\n\n';
  }

  const filename = `${category}.md`;
  writeFileSync(join(OUTPUT_DIR, filename), md);
  console.log(`  Generated ${filename} (${catEntries.length} entries)`);
}

// Generate index README
let index = `---\nicon: compass\n---\n\n# x402 API Directory\n\n`;
index += `**${entries.length} x402 APIs** you can call with Floe credit. Every endpoint listed here accepts USDC on Base and works with \`x402_fetch\` or \`/v1/proxy/fetch\`.\n\n`;
index += `| Category | APIs | Highlights |\n`;
index += `|----------|------|------------|\n`;

const categoryOrder = [
  'web-search', 'social-news', 'crypto-data', 'risk-security',
  'llm-inference', 'media-generation', 'browser-compute', 'storage',
  'identity-reputation', 'payments-commerce', 'infra-gateway', 'agent-tooling',
];

for (const cat of categoryOrder) {
  const catEntries = grouped[cat];
  if (!catEntries) continue;
  const meta = CATEGORY_META[cat];
  const highlights = catEntries.slice(0, 3).map(e => e.provider).join(', ');
  index += `| [${meta.title}](${cat}.md) | ${catEntries.length} | ${highlights}... |\n`;
}

index += `\n## Call Any Listed API\n\n`;
index += '```bash\n';
index += `curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \\\n`;
index += `  -H "Authorization: Bearer $FLOE_API_KEY" \\\n`;
index += `  -H "Content-Type: application/json" \\\n`;
index += `  -d '{"url": "https://api.firecrawl.dev/v1/x402/search", "method": "POST"}'\n`;
index += '```\n\n';
index += `Or with AgentKit:\n\n`;
index += '```typescript\n';
index += `await agentkit.run("x402_fetch", { url: "https://api.firecrawl.dev/v1/x402/search", method: "POST" });\n`;
index += '```\n\n';
index += `## Browse the Full Ecosystem\n\n`;
  index += `This directory is a curated subset verified to work with Floe credit. The broader x402 ecosystem has **46,000+ indexed endpoints** across multiple registries:\n\n`;
  index += `| Directory | What it is | Link |\n`;
  index += `|-----------|-----------|------|\n`;
  index += `| **CDP Bazaar** | Coinbase's canonical index — 46,000+ endpoints | [Browse →](https://docs.cdp.coinbase.com/x402/bazaar) |\n`;
  index += `| **x402scan** | Block-explorer-style analytics: servers, sellers, volume | [Browse →](https://x402scan.com) |\n`;
  index += `| **x402list.fun** | Searchable directory with category and pricing filters | [Browse →](https://x402list.fun) |\n`;
  index += `| **x402station** | Performance and reliability monitoring | [Browse →](https://x402station.com) |\n`;
  index += `| **EntRoute** | Machine-first ranked discovery with semantic search | [Browse →](https://entroute.com) |\n`;
  index += `| **x402.org Ecosystem** | Foundation-maintained provider and facilitator list | [Browse →](https://x402.org/ecosystem) |\n\n`;
  index += `**Any USDC-on-Base x402 endpoint works with Floe credit** — even if it's not listed here. Just pass the URL to \`x402_fetch\` or \`/v1/proxy/fetch\`.\n\n`;
  index += `## Submit an API\n\n[How to submit →](submit.md)\n`;

writeFileSync(join(OUTPUT_DIR, 'README.md'), index);
console.log(`  Generated README.md (index)`);

// Generate submit page
const submit = `---
icon: plus
---

# Submit an API

Want your x402 API listed in the Floe directory? Two ways:

## Option 1: Pull Request (recommended)

1. Fork [floe-labs-docs](https://github.com/Floe-Labs/floe-labs-docs)
2. Add a JSON file to \`x402-directory/entries/your-api-name.json\`
3. Follow the schema in \`x402-directory/schema.json\`
4. Open a PR — we'll verify the endpoint and merge

## Option 2: Contact Us

Email [hello@floelabs.xyz](mailto:hello@floelabs.xyz) or message us on [Discord](https://discord.gg/floelabs) with:
- API endpoint URL
- Provider name
- Pricing (per-call in USDC)
- Brief description

## Requirements

- Must accept USDC on Base (chain ID 8453) via x402 protocol
- Must respond with HTTP 402 and a valid \`PAYMENT-REQUIRED\` header
- Must be reachable and functional at the time of submission
`;

writeFileSync(join(OUTPUT_DIR, 'submit.md'), submit);
console.log(`  Generated submit.md`);

// Generate directory.json manifest
const manifest = {
  schema: 'floe-directory/v1',
  version: '1.0.0',
  entryCount: entries.length,
  categories: categoryOrder,
  entries: entries.sort((a, b) => a.id.localeCompare(b.id)),
};
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
console.log(`  Generated directory.json (${entries.length} entries)`);

console.log('\nDone!');
