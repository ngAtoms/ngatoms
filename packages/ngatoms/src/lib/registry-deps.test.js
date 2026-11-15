/**
 * @file Checks the real registry against the code it lists: every listed
 * file exists, a component that imports another registry component declares
 * it in `registryDependencies` so `ngatoms add` installs it too, and a
 * declared dependency is imported. Imports are read with TypeScript's
 * pre-processor, so comments are ignored and dynamic and side-effect imports
 * count.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const registry = JSON.parse(readFileSync(`${ROOT}registry/registry.json`, 'utf8'));
const names = new Set(registry.components.map(component => component.name));

/** A sibling component path: `../name` (its barrel) or `../name/…` (a file inside it). */
const SIBLING = /^\.\.\/([a-z0-9-]+)(?:\/.*)?$/;

/**
 * Names of the sibling folders a source file imports: static, `export … from`,
 * side-effect and dynamic imports, never text inside comments.
 *
 * @param {string} source TypeScript source.
 * @returns {string[]} Folder names, in order of appearance.
 */
function siblingImports(source) {
  return ts
    .preProcessFile(source, true, true)
    .importedFiles.map(file => SIBLING.exec(file.fileName)?.[1])
    .filter(name => name !== undefined);
}

/**
 * Registry components a component's TypeScript files import.
 *
 * @param {{ files?: string[] }} component Registry entry.
 * @returns {Set<string>} Names of the imported components.
 */
function importedComponents(component) {
  const used = new Set();
  for (const file of component.files ?? []) {
    if (!file.endsWith('.ts') || file.endsWith('.spec.ts')) continue;
    for (const name of siblingImports(readFileSync(`${ROOT}${file}`, 'utf8'))) {
      if (names.has(name)) used.add(name);
    }
  }
  return used;
}

describe('registry dependencies', () => {
  it('reads barrel, file, side-effect and dynamic imports, and ignores comments', () => {
    const source = [
      "/** Example: import { X } from '../tabs' */",
      "import { A } from '../overlay';",
      'import { B } from "../dropdown-menu/dropdown-menu.component";',
      "import '../badge/badge.styles';",
      "export * from '../select';",
      "const lazy = () => import('../popover');",
    ].join('\n');
    assert.deepEqual(siblingImports(source), ['overlay', 'dropdown-menu', 'badge', 'select', 'popover']);
  });

  it('lists only files that exist', () => {
    const missing = registry.components.flatMap(component =>
      (component.files ?? []).filter(file => !existsSync(`${ROOT}${file}`)).map(file => `${component.name}: ${file}`),
    );
    assert.deepEqual(missing, []);
  });

  for (const component of registry.components) {
    it(`${component.name} declares exactly the components it imports`, () => {
      const used = [...importedComponents(component)].sort();
      const declared = [...(component.registryDependencies ?? [])].sort();
      assert.deepEqual(declared, used);
    });
  }
});
