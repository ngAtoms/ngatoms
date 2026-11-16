import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { VERSION, loadSource, getRawUrl, fetchPinned } from './github.js';

const COMMIT = '0123456789abcdef0123456789abcdef01234567';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const BODY = new TextEncoder().encode('export const ok = true;\n');
const FILE = 'packages/primitives/src/button/index.ts';
const SRC = { commit: COMMIT, files: { [FILE]: sha256(BODY) } };

/** Replaces fetch with one that answers `body` and records the URLs asked for. */
function serve(body, status = 200) {
  const urls = [];
  mock.method(globalThis, 'fetch', async url => {
    urls.push(url);
    return { ok: status === 200, status, arrayBuffer: async () => body.buffer };
  });
  return urls;
}

afterEach(() => mock.restoreAll());

describe('github.js — pinned source', () => {
  it('VERSION is a non-empty string', () => {
    assert.ok(typeof VERSION === 'string' && VERSION.length > 0);
  });

  it('refuses to run without a pinned source, with no fallback to a branch or tag', () => {
    assert.throws(() => loadSource('/nonexistent/source.json'), /no pinned source/);
  });

  it('refuses a pinned source whose commit or hashes are malformed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ngatoms-src-'));
    try {
      const path = join(dir, 'source.json');
      writeFileSync(path, JSON.stringify({ commit: 'rc', files: {} }));
      assert.throws(() => loadSource(path), /malformed/);
      writeFileSync(path, JSON.stringify({ commit: COMMIT, files: { [FILE]: 'nope' } }));
      assert.throws(() => loadSource(path), /malformed/);
      writeFileSync(path, JSON.stringify(SRC));
      assert.deepEqual(loadSource(path), SRC);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('builds URLs at the pinned commit, never at a branch or tag', () => {
    assert.equal(
      getRawUrl('registry/registry.json', SRC),
      `https://raw.githubusercontent.com/ngAtoms/ngatoms/${COMMIT}/registry/registry.json`
    );
    assert.equal(getRawUrl(FILE, SRC), `https://raw.githubusercontent.com/ngAtoms/ngatoms/${COMMIT}/${FILE}`);
  });

  it('refuses a file path that is not under packages/', () => {
    assert.throws(() => getRawUrl('packages/../../../evil/repo/main/x.ts', SRC), /Refusing registry file/);
    assert.throws(() => getRawUrl('https://evil.example/x.ts', SRC), /Refusing registry file/);
    assert.throws(() => getRawUrl('registry/../../../evil/repo/main/registry.json', SRC), /Refusing registry file/);
  });
});

describe('github.js — fetchPinned', () => {
  it('returns the file when its SHA-256 matches the pinned one', async () => {
    const urls = serve(BODY);
    assert.equal(await fetchPinned(FILE, SRC), 'export const ok = true;\n');
    assert.deepEqual(urls, [`https://raw.githubusercontent.com/ngAtoms/ngatoms/${COMMIT}/${FILE}`]);
  });

  it('refuses a file whose content differs from the pinned one', async () => {
    serve(new TextEncoder().encode('export const ok = false;\n'));
    await assert.rejects(fetchPinned(FILE, SRC), /SHA-256 does not match/);
  });

  it('refuses a file that is not pinned, without downloading it', async () => {
    const urls = serve(BODY);
    await assert.rejects(fetchPinned('packages/primitives/src/evil/x.ts', SRC), /not part of the source/);
    await assert.rejects(fetchPinned('constructor', SRC), /not part of the source/);
    assert.deepEqual(urls, []);
  });

  it('throws with 404 guidance message on 404 response', async () => {
    serve(BODY, 404);
    await assert.rejects(fetchPinned(FILE, SRC), /Check your CLI version/);
  });

  it('throws with status code on non-ok non-404 response', async () => {
    serve(BODY, 500);
    await assert.rejects(fetchPinned(FILE, SRC), /500/);
  });
});
