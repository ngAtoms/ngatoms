import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { add, computeImportPath, patchStylesFile, writeComponent } from './add.js';

let tmpDir;

describe('add.js — computeImportPath', () => {
  it('default config: styles at src/styles.css, components at src/components', () => {
    const result = computeImportPath('src/styles.css', 'src/components', 'button', 'button.styles.css');
    assert.equal(result, './components/button/button.styles.css');
  });

  it('styles file and components dir at same level', () => {
    const result = computeImportPath('styles.css', 'components', 'button', 'button.styles.css');
    assert.equal(result, './components/button/button.styles.css');
  });

  it('styles file deeper than components dir — uses .. traversal', () => {
    const result = computeImportPath('src/app/styles.css', 'src/components', 'button', 'button.styles.css');
    assert.equal(result, '../components/button/button.styles.css');
  });
});

describe('add.js — patchStylesFile', () => {
  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ngatoms-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns false when styles file does not exist', () => {
    const result = patchStylesFile(join(tmpDir, 'nonexistent.css'), "@import './button/button.styles.css';");
    assert.equal(result, false);
  });

  it('appends the import line when not already present', () => {
    const file = join(tmpDir, 'styles.css');
    writeFileSync(file, 'body { margin: 0; }\n', 'utf8');
    const result = patchStylesFile(file, "@import './components/button/button.styles.css';");
    assert.equal(result, true);
    const content = readFileSync(file, 'utf8');
    assert.ok(content.includes("@import './components/button/button.styles.css';"));
  });

  it('does not duplicate the import if already present', () => {
    const file = join(tmpDir, 'styles.css');
    writeFileSync(file, "@import './components/button/button.styles.css';\nbody { margin: 0; }\n", 'utf8');
    const result = patchStylesFile(file, "@import './components/button/button.styles.css';");
    assert.equal(result, false);
    const content = readFileSync(file, 'utf8');
    const count = (content.match(/@import/g) || []).length;
    assert.equal(count, 1);
  });
});

describe('add.js — ngatoms.json paths and component names', () => {
  let fetchCalls;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ngatoms-test-'));
    fetchCalls = 0;
    mock.method(globalThis, 'fetch', async () => {
      fetchCalls++;
      throw new Error('no network in tests');
    });
  });

  afterEach(() => {
    mock.restoreAll();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  /** Writes an ngatoms.json in the temp project. */
  const config = (componentsDir, stylesFile) =>
    writeFileSync(join(tmpDir, 'ngatoms.json'), JSON.stringify({ componentsDir, stylesFile, themes: [] }), 'utf8');

  it('refuses a folder outside the project, before any download', async () => {
    config('../../home/dev/.ssh', 'src/styles.css');
    await assert.rejects(add('button', tmpDir), /componentsDir in ngatoms.json/);
    assert.equal(fetchCalls, 0);
  });

  it('refuses a stylesheet outside the project, before any download', async () => {
    config('src/components', '../../.zshrc');
    await assert.rejects(add('button', tmpDir), /stylesFile in ngatoms.json/);
    assert.equal(fetchCalls, 0);
  });

  it('refuses a component folder outside the components folder', async () => {
    const component = { name: '../../escape', files: ['packages/primitives/src/x/x.ts'] };
    await assert.rejects(writeComponent(component, { componentsDir: 'src/components', stylesFile: 'src/styles.css' }, tmpDir, join(tmpDir, 'src/styles.css')), /component folder/);
    assert.equal(existsSync(join(tmpDir, 'escape')), false);
    assert.equal(fetchCalls, 0);
  });

  it('refuses a file outside its component folder', async () => {
    const component = { name: 'x', files: ['packages/primitives/src/x/..'] };
    await assert.rejects(writeComponent(component, { componentsDir: 'src/components', stylesFile: 'src/styles.css' }, tmpDir, join(tmpDir, 'src/styles.css')), /file packages/);
    assert.equal(fetchCalls, 0);
  });

  it('refuses a component name with unsupported characters, before any download', async () => {
    config('src/components', 'src/styles.css');
    await assert.rejects(add('../../../.vscode', tmpDir), /Refusing component name/);
    assert.equal(fetchCalls, 0);
  });
});
