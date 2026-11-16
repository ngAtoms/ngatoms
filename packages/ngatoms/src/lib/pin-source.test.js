import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { REPO_ROOT, buildSource, main } from '../../scripts/pin-source.mjs';
import { loadSource } from './github.js';

const COMMIT = 'fedcba9876543210fedcba9876543210fedcba98';

/** Runs `fn` with a temp folder and removes it after. */
function withTemp(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'ngatoms-pin-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const silent = fn => {
  const log = console.log;
  console.log = () => {};
  try {
    return fn();
  } finally {
    console.log = log;
  }
};

describe('pin-source — release pin', () => {
  it('pins the commit and the SHA-256 of the registry, the tokens and every registry file', () => {
    const source = buildSource(REPO_ROOT, COMMIT);
    const registry = JSON.parse(readFileSync(join(REPO_ROOT, 'registry/registry.json'), 'utf8'));
    const expected = new Set(['registry/registry.json', 'packages/tokens/src/tokens.css', ...registry.components.flatMap(c => c.files)]);
    assert.equal(source.commit, COMMIT);
    assert.deepEqual(new Set(Object.keys(source.files)), expected);
    for (const [path, hash] of Object.entries(source.files)) {
      assert.equal(hash, createHash('sha256').update(readFileSync(join(REPO_ROOT, path))).digest('hex'), path);
    }
  });

  it('refuses a branch or tag name in place of a commit SHA', () => {
    assert.throws(() => buildSource(REPO_ROOT, 'rc'), /not a full commit SHA/);
    assert.throws(() => buildSource(REPO_ROOT, 'ngatoms@1.0.0'), /not a full commit SHA/);
  });

  it('writes a source the CLI accepts when GITHUB_SHA is set', () =>
    withTemp(dir => {
      const out = join(dir, 'source.json');
      silent(() => main([], { GITHUB_SHA: COMMIT }, out));
      assert.equal(loadSource(out).commit, COMMIT);
      assert.equal(main(['--check'], {}, out), 0);
    }));

  it('pins nothing on a local build and removes an old source, so a later pack fails', () =>
    withTemp(dir => {
      const out = join(dir, 'source.json');
      writeFileSync(out, '{}');
      silent(() => main([], {}, out));
      assert.equal(existsSync(out), false);
      assert.throws(() => main(['--check'], {}, out), /pin-source --check: no valid pinned source.*cannot be packed or published/s);
    }));
});

/** A small checkout: a registry with one component, the tokens and the component file. */
function fakeCheckout(dir) {
  const write = (path, text) => {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  write('registry/registry.json', JSON.stringify({ components: [{ name: 'x', files: ['packages/primitives/src/x/x.ts'], cssImport: 'x.css' }] }));
  write('packages/tokens/src/tokens.css', ':root{}\n');
  write('packages/primitives/src/x/x.ts', 'export const x = 1;\n');
  return write;
}

describe('pin-source --check — the pin must match the checkout', () => {
  const OTHER = '1111111111111111111111111111111111111111';

  it('passes for a pin made from this checkout, with and without GITHUB_SHA', () =>
    withTemp(dir => {
      fakeCheckout(dir);
      const out = join(dir, 'source.json');
      silent(() => main([], { GITHUB_SHA: COMMIT }, out, dir));
      assert.equal(silent(() => main(['--check'], { GITHUB_SHA: COMMIT }, out, dir)), 0);
      assert.equal(silent(() => main(['--check'], {}, out, dir)), 0);
    }));

  it('fails when a hash in source.json was swapped', () =>
    withTemp(dir => {
      fakeCheckout(dir);
      const out = join(dir, 'source.json');
      silent(() => main([], { GITHUB_SHA: COMMIT }, out, dir));
      const source = JSON.parse(readFileSync(out, 'utf8'));
      source.files['packages/primitives/src/x/x.ts'] = '0'.repeat(64);
      writeFileSync(out, JSON.stringify(source));
      assert.throws(() => main(['--check'], { GITHUB_SHA: COMMIT }, out, dir), /1 file\(s\) differ from the checkout: packages\/primitives\/src\/x\/x\.ts/);
    }));

  it('fails when a pinned file changed in the checkout after the pin', () =>
    withTemp(dir => {
      const write = fakeCheckout(dir);
      const out = join(dir, 'source.json');
      silent(() => main([], { GITHUB_SHA: COMMIT }, out, dir));
      write('packages/tokens/src/tokens.css', ':root{--changed:1}\n');
      assert.throws(() => main(['--check'], { GITHUB_SHA: COMMIT }, out, dir), /differ from the checkout: packages\/tokens\/src\/tokens\.css/);
    }));

  it('fails when a file was dropped from the pin', () =>
    withTemp(dir => {
      fakeCheckout(dir);
      const out = join(dir, 'source.json');
      silent(() => main([], { GITHUB_SHA: COMMIT }, out, dir));
      const source = JSON.parse(readFileSync(out, 'utf8'));
      delete source.files['registry/registry.json'];
      writeFileSync(out, JSON.stringify(source));
      assert.throws(() => main(['--check'], {}, out, dir), /differ from the checkout: registry\/registry\.json/);
    }));

  it('fails when the pin is for a commit other than GITHUB_SHA', () =>
    withTemp(dir => {
      fakeCheckout(dir);
      const out = join(dir, 'source.json');
      silent(() => main([], { GITHUB_SHA: COMMIT }, out, dir));
      assert.throws(() => main(['--check'], { GITHUB_SHA: OTHER }, out, dir), new RegExp(`pin is for ${COMMIT}, not GITHUB_SHA ${OTHER}`));
    }));

  it('fails with a message for whoever is packing when source.json is missing', () =>
    withTemp(dir => {
      fakeCheckout(dir);
      assert.throws(
        () => main(['--check'], { GITHUB_SHA: COMMIT }, join(dir, 'source.json'), dir),
        /no valid pinned source.*cannot be packed or published.*GITHUB_SHA=<commit> node packages\/ngatoms\/scripts\/pin-source\.mjs/s
      );
    }));
});
