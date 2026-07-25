import { readFileSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

/**
 * Concatenates every page in SUMMARY.md into a single llms-full.txt so an
 * agent can read the whole corpus in one fetch instead of crawling the site.
 *
 * SUMMARY.md is the nav source of truth, so it is also the source of truth
 * here: pages not in the nav are invisible on the site and are skipped.
 *
 * Run: npx tsx scripts/build-llms-full.ts
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SUMMARY_PATH = join(ROOT, 'SUMMARY.md');
const OUTPUT_PATH = join(ROOT, 'llms-full.txt');

const SITE_BASE = 'https://floe-labs.gitbook.io/docs';

interface Page {
  title: string;
  /** Repo-relative path, e.g. docs/developers/mcp-server.md */
  path: string;
  /** Published URL, e.g. https://floe-labs.gitbook.io/docs/developers/mcp-server.md */
  url: string;
}

// GitBook derives a page URL from the SUMMARY section heading + the page
// slug, NOT from the repo path (docs/getting-started/quickstart.md is served
// at /docs/quickstart/quickstart.md). Nested entries are prefixed with their
// parent's slug, and a README.md takes its directory's name.
const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function pageSlug(path: string): string {
  const file = basename(path, '.md');
  if (file.toLowerCase() !== 'readme') return file;
  // A README takes its directory's name — except the repo-root README, which
  // is the site homepage and is published as /readme.md.
  const dir = basename(dirname(path));
  return dir && dir !== '.' ? dir : 'readme';
}

const summary = readFileSync(SUMMARY_PATH, 'utf-8');
const pages: Page[] = [];
let section = '';
let parentSlug = '';
let skippedExternal = 0;

for (const line of summary.split('\n')) {
  const heading = line.match(/^##\s+(.*)$/);
  if (heading) {
    section = slugify(heading[1]);
    parentSlug = '';
    continue;
  }
  const entry = line.match(/^(\s*)\*\s+\[([^\]]+)\]\(([^)]+)\)\s*$/);
  if (!entry) continue;

  const [, indent, title, target] = entry;
  if (/^https?:\/\//.test(target)) {
    skippedExternal++;
    continue;
  }

  const slug = pageSlug(target);
  const nested = indent.length > 0;
  if (!nested) {
    const segments = [section, slug].filter(Boolean);
    pages.push({ title, path: target, url: `${SITE_BASE}/${segments.join('/')}.md` });
    parentSlug = slug;
  } else {
    const segments = [section, parentSlug, slug].filter(Boolean);
    pages.push({ title, path: target, url: `${SITE_BASE}/${segments.join('/')}.md` });
  }
}

console.log(`Read ${pages.length} nav pages from SUMMARY.md (${skippedExternal} external links skipped)`);

// Read every page; a broken nav link is a build error, not a silent gap.
const rendered: string[] = [];
let errors = 0;

for (const page of pages) {
  let body: string;
  try {
    body = readFileSync(join(ROOT, page.path), 'utf-8');
  } catch {
    console.error(`  ERROR: ${page.path} is in SUMMARY.md but does not exist`);
    errors++;
    continue;
  }
  // Drop the optional `---\nicon: …\n---` frontmatter — it is GitBook
  // presentation metadata, not content an agent should read.
  body = body.replace(/^---\n[\s\S]*?\n---\n+/, '').trim();

  rendered.push(
    [
      '='.repeat(78),
      `# ${page.title}`,
      `Source: ${page.path}`,
      `URL: ${page.url}`,
      '='.repeat(78),
      '',
      body,
    ].join('\n'),
  );
}

if (errors > 0) {
  console.error(`\n${errors} broken SUMMARY.md link(s). Fix them before generating.`);
  process.exit(1);
}

const header = [
  '# Floe Documentation — Full Corpus',
  '',
  '> Every page in the Floe documentation navigation, concatenated for LLM agents.',
  `> ${pages.length} pages. Generated from SUMMARY.md by scripts/build-llms-full.ts — do not edit by hand.`,
  '> Annotated index (per-page descriptions, the x402 vendor directory with prices, key facts): llms.txt in this repo.',
  '> Machine-readable API spec: https://credit-api.floelabs.xyz/.well-known/openapi.yaml',
  '> x402 vendor manifest: https://raw.githubusercontent.com/Floe-Labs/floe-labs-docs/main/x402-directory/directory.json',
  '> Agent setup runbook: https://dev-dashboard.floelabs.xyz/agents.md',
  '',
  '## Contents',
  '',
  ...pages.map((p) => `- ${p.title} — ${p.url}`),
  '',
].join('\n');

writeFileSync(OUTPUT_PATH, `${header}\n${rendered.join('\n\n')}\n`);
console.log(`  Generated llms-full.txt (${pages.length} pages, ${rendered.join('').length} chars)`);

console.log('\nDone!');
