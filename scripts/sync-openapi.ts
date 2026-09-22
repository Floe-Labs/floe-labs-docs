/**
 * Sync the committed OpenAPI artifact with the spec the API actually serves.
 *
 * `openapi/floe-api.yaml` is one of two agent-consumable artifacts this repo
 * ships, and nothing kept it in step with the source: it drifted to 33 paths
 * against the served spec's 180 — three weeks and four whole product surfaces
 * behind — before anyone noticed.
 *
 * The served file is floe-monorepo's `apps/api/openapi.yaml`, exposed at
 * /.well-known/openapi.yaml (apps/api/src/index.ts). This copies it verbatim
 * with one exception.
 *
 * THE EXCEPTION: /v1/status is served by @floe/status-api, a DIFFERENT
 * deployment, so the credit-api spec does not carry it. A straight copy would
 * silently delete documentation for a live public endpoint, so its path block
 * and SystemStatus schema are carried across from the existing copy.
 *
 * Usage: npx tsx scripts/sync-openapi.ts <path-to-served-spec>
 * Exits 0 and writes nothing when the files already agree.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2];
const dst = 'openapi/floe-api.yaml';
if (!src) {
  console.error('usage: sync-openapi.ts <path-to-served-spec>');
  process.exit(1);
}

/** A top-level block from `start` up to the next sibling at `indent`. */
function block(text: string, start: string, indent: string): string | null {
  const from = text.indexOf(start);
  if (from === -1) return null;
  const rest = text.slice(from + start.length);
  const next = rest.search(new RegExp(`\\n${indent}[A-Za-z/]`));
  return start + (next === -1 ? rest : rest.slice(0, next));
}

const served = readFileSync(src, 'utf8');
const existing = readFileSync(dst, 'utf8');
let out = served;

const statusPath = block(existing, '  /v1/status:', '  ');
if (statusPath && !out.includes('  /v1/status:')) {
  out = out.replace('  /v1/markets:', `${statusPath.trimEnd()}\n\n  /v1/markets:`);
}

const statusSchema = block(existing, '    SystemStatus:', '    ');
if (statusSchema && !out.includes('\n    SystemStatus:')) {
  out = out.replace('  schemas:\n', `  schemas:\n${statusSchema.trimEnd()}\n`);
}

if (out === existing) {
  console.log('openapi: already in sync');
  process.exit(0);
}
writeFileSync(dst, out);
const paths = (out.match(/^  \//gm) ?? []).length;
console.log(`openapi: synced — ${paths} paths`);
