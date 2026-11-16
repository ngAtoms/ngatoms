import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { assertRegistryFile } from './validate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf8')
);
// Defensive assertion: verify we resolved the right package.json
if (pkg.name !== 'ngatoms') {
  throw new Error(`Expected package "ngatoms", got "${pkg.name}". Check path resolution in github.js.`);
}

export const VERSION = pkg.version;

const RAW_BASE = 'https://raw.githubusercontent.com/ngAtoms/ngatoms';
const SOURCE_FILE = join(__dirname, 'source.json');
const COMMIT = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;

/**
 * Reads the source this CLI was released with: the commit it downloads from
 * and the SHA-256 of every file it may download. Written at release time by
 * scripts/pin-source.mjs. Without it the CLI refuses to download anything.
 */
export function loadSource(path = SOURCE_FILE) {
  let source;
  try {
    source = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error('This ngatoms build has no pinned source. Install a published version: npx ngatoms@latest');
  }
  const files = source?.files;
  if (!COMMIT.test(source?.commit ?? '') || !files || typeof files !== 'object'
    || !Object.values(files).every(hash => SHA256.test(hash))) {
    throw new Error('The pinned source of this ngatoms build is malformed. Reinstall: npx ngatoms@latest');
  }
  return source;
}

let pinned = null;

/** The pinned source, read once. */
function source() {
  pinned ??= loadSource();
  return pinned;
}

/** URL of a file at the pinned commit. Only the registry, the tokens and files under packages/ are allowed. */
export function getRawUrl(filepath, src = source()) {
  if (filepath !== 'registry/registry.json') assertRegistryFile(filepath);
  return `${RAW_BASE}/${src.commit}/${filepath}`;
}

export async function checkForUpdate() {
  try {
    const res = await fetch('https://registry.npmjs.org/ngatoms/latest', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return;
    const { version: latest } = await res.json();
    if (latest !== VERSION) {
      console.log(`\x1b[48;5;240m\x1b[37m  ↑ update  \x1b[0m \x1b[90mngatoms \x1b[0m\x1b[37m${VERSION}\x1b[0m\x1b[90m → \x1b[0m\x1b[32m${latest}\x1b[0m\x1b[90m  run \x1b[0m\x1b[37mnpm install ngatoms@latest\x1b[0m`);
    }
  } catch {
    // silently ignore — network issues should never block the CLI
  }
}

/**
 * Downloads a file at the pinned commit and checks it against its pinned
 * SHA-256. A file that is not pinned, or whose hash differs, is refused.
 */
export async function fetchPinned(filepath, src = source()) {
  const expected = Object.hasOwn(src.files, filepath) ? src.files[filepath] : null;
  if (!expected) throw new Error(`Refusing ${filepath}: it is not part of the source this CLI was released with.`);
  const url = getRawUrl(filepath, src);
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `404: ${url}\nCheck your CLI version or try: npx ngatoms@latest`
      );
    }
    throw new Error(`Fetch failed (${res.status}): ${url}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) {
    throw new Error(`Refusing ${filepath}: its SHA-256 does not match the source this CLI was released with.`);
  }
  return new TextDecoder().decode(bytes);
}
