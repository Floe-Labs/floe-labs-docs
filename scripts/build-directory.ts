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
  // Optional call examples (schema.json). `body` is the RAW string handed to
  // /v1/proxy/fetch, so it can be dropped into the generated curl verbatim.
  requestExample?: { headers?: Record<string, string>; body?: string; query?: string };
  responseExample?: { status: number; contentType?: string; body: string };
}

const CATEGORY_META: Record<string, { title: string; icon: string; description: string }> = {
  'web-search': { title: 'Web Search & Scraping', icon: 'globe', description: 'Web search, scraping, and data extraction.' },
  'social-news': { title: 'Social & News', icon: 'newspaper', description: 'Social media data, news signals, and content.' },
  'llm-inference': { title: 'LLM Inference', icon: 'brain', description: 'AI model inference — Claude, GPT, open-source models.' },
  // voice.md is HAND-CURATED (per-vendor payload examples, category sections) —
  // entries validate + list in the index/manifest, but no page is generated.
  'voice': { title: 'Voice Stack', icon: 'microphone', description: 'Speech-to-text, text-to-speech, telephony, and realtime voice.' },
  'media-generation': { title: 'Media Generation', icon: 'image', description: 'Image, video, audio, and music generation.' },
  'browser-compute': { title: 'Browser & Compute', icon: 'desktop', description: 'Headless browsers, proxies, and compute.' },
  'storage': { title: 'Storage', icon: 'database', description: 'File storage and agent memory.' },
  'identity-reputation': { title: 'Identity & Reputation', icon: 'fingerprint', description: 'Attestations, identity, and trust scores.' },
  'payments-commerce': { title: 'Payments & Commerce', icon: 'credit-card', description: 'Gift cards, merchant payments, fiat rails.' },
  'infra-gateway': { title: 'Infrastructure & Gateways', icon: 'server', description: 'Cloud infrastructure and gateway APIs.' },
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
  if (category === 'voice') {
    console.log(`  Skipped voice.md (hand-curated; ${catEntries.length} entries listed in index/manifest only)`);
    continue;
  }
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
    // Capability-first copy: the protocol version stays machine-readable in the
    // entry JSON / manifest, not in user-facing prose.
    md += `**Price:** $${e.priceUsd} ${e.asset} per call${pricingSuffix} · Base mainnet\n`;
    const compat = e.status === 'preview'
      ? 'Preview — verify compatibility before production use'
      : e.floeCompatible ? 'Yes' : 'No';
    md += `**Floe compatible:** ${compat}\n\n`;
    md += `> ${e.description}\n\n`;

    // Use the entry's requestExample when it has one, so the generated snippet
    // is a call that actually works rather than a URL-only skeleton. Fields are
    // joined by hand to keep the `"key": "value"` spacing the pages already use.
    const resource = e.requestExample?.query
      ? `${e.resource}${e.resource.includes('?') ? '&' : '?'}${e.requestExample.query}`
      : e.resource;
    const proxyFields = [`"url": ${JSON.stringify(resource)}`, `"method": ${JSON.stringify(e.method)}`];
    if (e.requestExample?.headers) proxyFields.push(`"headers": ${JSON.stringify(e.requestExample.headers)}`);
    if (e.requestExample?.body) proxyFields.push(`"body": ${JSON.stringify(e.requestExample.body)}`);

    md += '```bash\n';
    md += `# Call through Floe\n`;
    md += `curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \\\n`;
    md += `  -H "Authorization: Bearer $FLOE_API_KEY" \\\n`;
    md += `  -H "Content-Type: application/json" \\\n`;
    md += `  -d '{${proxyFields.join(', ')}}'\n`;
    md += '```\n\n';

    if (e.responseExample) {
      md += `Returns \`${e.responseExample.status}\`${e.responseExample.contentType ? ` \`${e.responseExample.contentType}\`` : ''}:\n\n`;
      md += '```json\n';
      md += `${e.responseExample.body}\n`;
      md += '```\n\n';
    }
  }

  const filename = `${category}.md`;
  writeFileSync(join(OUTPUT_DIR, filename), md);
  console.log(`  Generated ${filename} (${catEntries.length} entries)`);
}

const categoryOrder = [
  'web-search', 'social-news',
  'llm-inference', 'voice', 'media-generation', 'browser-compute', 'storage',
  'identity-reputation', 'payments-commerce', 'infra-gateway', 'agent-tooling',
];

// docs/x402-directory/README.md is HAND-CURATED (it is the in-nav "Vendor
// Marketplace" landing page, whose table points at the 7 hand-written category
// pages — not at the generated ones). This script used to overwrite it with a
// generic index, which silently took the published marketplace index down.
// Same rule as voice.md: report, never write. The per-category counts are
// printed so a maintainer can reconcile the page by hand when they drift.
console.log('  Skipped README.md (hand-curated marketplace index — never generated)');
for (const cat of categoryOrder) {
  const catEntries = grouped[cat];
  if (!catEntries) continue;
  console.log(`    ${CATEGORY_META[cat].title.padEnd(28)} ${String(catEntries.length).padStart(3)} entries`);
}

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

Email [hello@floelabs.xyz](mailto:hello@floelabs.xyz) with:
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
