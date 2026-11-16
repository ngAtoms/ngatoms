/**
 * @file Guards the token names of `@ngatoms/ngatoms-tokens`. Every
 * `--nga-*` custom property that rc.5 defined, in each selector (`:root`,
 * `.dark`), must still be defined there: apps and copied components read
 * them by name, so a removed or renamed token is a breaking change.
 * New names are allowed. `rc-token-names.json` is the frozen rc.5 list.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tokensCss = readFileSync(new URL('../src/tokens.css', import.meta.url), 'utf8');
const rcNames = JSON.parse(readFileSync(new URL('./rc-token-names.json', import.meta.url), 'utf8'));

/**
 * The `--nga-*` names each selector defines, comments left out.
 *
 * @param {string} css Stylesheet text.
 * @returns {Map<string, Set<string>>} Names by selector.
 */
function definedNames(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const bySelector = new Map();
  for (const [, selector, body] of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const key = selector.trim().replace(/\s+/g, ' ');
    const names = bySelector.get(key) ?? new Set();
    for (const [, name] of body.matchAll(/(--nga-[a-z0-9-]+)\s*:/g)) names.add(name);
    bySelector.set(key, names);
  }
  return bySelector;
}

describe('token names', () => {
  const current = definedNames(tokensCss);

  for (const [selector, names] of Object.entries(rcNames)) {
    it(`keeps every rc.5 name defined in ${selector}`, () => {
      const defined = current.get(selector) ?? new Set();
      assert.deepEqual(names.filter(name => !defined.has(name)), []);
    });
  }
});
