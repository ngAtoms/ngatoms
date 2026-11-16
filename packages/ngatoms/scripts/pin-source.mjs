#!/usr/bin/env node
/**
 * Pins the source the CLI downloads from. The release job runs it directly,
 * in its own step before the version bump, so the checkout is exactly the
 * GITHUB_SHA commit; it checks the pin again after the bump, and `prepack`
 * checks it once more, so no tarball ships without a pin that matches.
 *
 * - `node scripts/pin-source.mjs` reads the commit from GITHUB_SHA (set by
 *   GitHub Actions) and writes src/lib/source.json: that commit and the
 *   SHA-256 of the registry, the tokens and every registry file, read from the
 *   checkout. Without GITHUB_SHA (a local build) it writes nothing and removes
 *   an old source.json.
 * - `node scripts/pin-source.mjs --check` fails unless source.json is present
 *   and well formed, its commit is GITHUB_SHA when that is set, and every
 *   hash matches the same files hashed again from the checkout.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSource } from '../src/lib/github.js';
import { validateRegistry } from '../src/lib/validate.js';

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(here, '../../..');
export const SOURCE_PATH = join(here, '../src/lib/source.json');
const ALWAYS = ['registry/registry.json', 'packages/tokens/src/tokens.css'];

/** The commit and the SHA-256 of every file the CLI may download, read from `root`. */
export function buildSource(root, commit) {
  if (!/^[0-9a-f]{40}$/.test(commit ?? '')) throw new Error(`pin-source: ${JSON.stringify(commit)} is not a full commit SHA.`);
  const registry = validateRegistry(JSON.parse(readFileSync(join(root, 'registry/registry.json'), 'utf8')));
  const paths = new Set([...ALWAYS, ...registry.components.flatMap(component => component.files)]);
  const files = {};
  for (const path of [...paths].sort()) {
    files[path] = createHash('sha256').update(readFileSync(join(root, path))).digest('hex');
  }
  return { commit, files };
}

/**
 * Checks the pin at `out` against the checkout at `root`; throws with a
 * message for whoever is packing when it is missing, malformed, for another
 * commit, or out of date.
 */
export function checkSource(root, env, out) {
  const fail = reason => new Error(`pin-source --check: ${reason}. The ngatoms package cannot be packed or published without a matching pin; run \`GITHUB_SHA=<commit> node packages/ngatoms/scripts/pin-source.mjs\` on a clean checkout of that commit first.`);
  let source;
  try {
    source = loadSource(out);
  } catch {
    throw fail(`no valid pinned source at ${out}`);
  }
  if (env.GITHUB_SHA && source.commit !== env.GITHUB_SHA) {
    throw fail(`the pin is for ${source.commit}, not GITHUB_SHA ${env.GITHUB_SHA}`);
  }
  const fresh = buildSource(root, source.commit).files;
  const paths = new Set([...Object.keys(fresh), ...Object.keys(source.files)]);
  const stale = [...paths].filter(path => fresh[path] !== source.files[path]).sort();
  if (stale.length) {
    throw fail(`${stale.length} file(s) differ from the checkout: ${stale.slice(0, 5).join(', ')}${stale.length > 5 ? ', …' : ''}`);
  }
  return source;
}

/** Runs the script; returns the exit code. */
export function main(argv = process.argv.slice(2), env = process.env, out = SOURCE_PATH, root = REPO_ROOT) {
  if (argv.includes('--check')) {
    const source = checkSource(root, env, out);
    console.log(`pin-source --check: ${Object.keys(source.files).length} files match the pin at ${source.commit}.`);
    return 0;
  }
  if (!env.GITHUB_SHA) {
    if (existsSync(out)) rmSync(out);
    console.log('pin-source: GITHUB_SHA is not set, so no source is pinned (local build).');
    return 0;
  }
  const source = buildSource(root, env.GITHUB_SHA);
  writeFileSync(out, JSON.stringify(source, null, 2) + '\n', 'utf8');
  console.log(`pin-source: ${Object.keys(source.files).length} files pinned at ${source.commit}.`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
