import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertCssImport, assertInside, assertName, assertRegistryFile, validateRegistry } from './validate.js';

const entry = overrides => ({
  components: [{ name: 'button', files: ['packages/primitives/src/button/index.ts'], cssImport: 'button.styles.css', ...overrides }],
});

describe('validate.js — paths', () => {
  it('refuses a component name or dependency with unsupported characters', () => {
    assert.throws(() => assertName('../../../home/dev/.ssh'), /Refusing component name/);
    assert.throws(() => validateRegistry(entry({ name: '..' })), /Refusing component name/);
    assert.throws(() => validateRegistry(entry({ registryDependencies: ['../../.vscode'] })), /Refusing registry dependency/);
    assert.throws(() => assertName('Button'), /Refusing/);
    assert.doesNotThrow(() => assertName('dropdown-menu'));
  });

  it('refuses a target outside its base after the join, and accepts one inside', () => {
    const base = '/proj/src/components';
    assert.throws(() => assertInside(base, join(base, '../../../home/dev/.ssh'), 'folder'), /outside/);
    assert.throws(() => assertInside(base, '/proj/src/components-evil/x', 'folder'), /outside/);
    assert.throws(() => assertInside('/proj', '/etc/passwd', 'file'), /outside/);
    assert.doesNotThrow(() => assertInside(base, join(base, 'button'), 'folder'));
    assert.doesNotThrow(() => assertInside(base, join(base, '..button'), 'folder'));
  });
});

describe('validate.js — registry file paths', () => {
  it('refuses registry files outside packages/ or with ..', () => {
    assert.throws(() => validateRegistry(entry({ files: ['packages/../../../evil/repo/main/x.ts'] })), /Refusing registry file/);
    assert.throws(() => assertRegistryFile('https://evil.example/x.ts'), /Refusing registry file/);
    assert.throws(() => assertRegistryFile('/etc/passwd'), /Refusing registry file/);
    assert.throws(() => assertRegistryFile('packages/primitives/src/%2e%2e/x.ts'), /Refusing registry file/);
    assert.doesNotThrow(() => assertRegistryFile('packages/primitives/src/button/button.directive.ts'));
  });
});

describe('validate.js — stylesheet names', () => {
  it('refuses a cssImport that is not a plain .css file name', () => {
    assert.throws(() => assertCssImport("a.css'; @import url(https://evil.example/x.css); /*"), /Refusing cssImport/);
    assert.throws(() => assertCssImport('a.css\n@import url(https://evil.example/x.css);'), /Refusing cssImport/);
    assert.throws(() => validateRegistry(entry({ cssImport: '../../x.css' })), /Refusing cssImport/);
    assert.doesNotThrow(() => assertCssImport('button.styles.css'));
  });
});

describe('validate.js — the real registry', () => {
  it('passes every check', () => {
    const root = join(fileURLToPath(import.meta.url), '../../../../..');
    const registry = JSON.parse(readFileSync(join(root, 'registry/registry.json'), 'utf8'));
    assert.doesNotThrow(() => validateRegistry(registry));
  });
});
