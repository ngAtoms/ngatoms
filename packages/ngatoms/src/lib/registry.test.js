import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { findComponent, listComponents, fetchRegistry, resolveDependencies } from './registry.js';

const MOCK_REGISTRY = {
  components: [
    {
      name: 'button',
      description: 'A button directive.',
      files: [
        'packages/primitives/src/button/button.directive.ts',
        'packages/primitives/src/button/button.styles.css',
        'packages/primitives/src/button/index.ts',
      ],
      cssImport: 'button.styles.css',
    },
  ],
};

describe('registry.js — pure helpers', () => {
  it('findComponent returns the component when it exists', () => {
    const result = findComponent(MOCK_REGISTRY, 'button');
    assert.equal(result.name, 'button');
    assert.equal(result.cssImport, 'button.styles.css');
    assert.equal(result.files.length, 3);
  });

  it('findComponent returns null for an unknown component', () => {
    const result = findComponent(MOCK_REGISTRY, 'input');
    assert.equal(result, null);
  });

  it('listComponents returns array of component names', () => {
    const names = listComponents(MOCK_REGISTRY);
    assert.deepEqual(names, ['button']);
  });
});

describe('registry.js — fetchRegistry', () => {
  it('fetches and parses registry JSON', async () => {
    mock.method(globalThis, 'fetch', async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(MOCK_REGISTRY),
    }));
    const registry = await fetchRegistry();
    assert.equal(registry.components.length, 1);
    assert.equal(registry.components[0].name, 'button');
    mock.restoreAll();
  });
});

describe('registry.js — resolveDependencies', () => {
  const registry = {
    components: [
      { name: 'overlay', files: [] },
      { name: 'dropdown-menu', files: [], registryDependencies: ['overlay'] },
      { name: 'context-menu', files: [], registryDependencies: ['overlay', 'dropdown-menu'] },
      { name: 'button', files: [] },
      { name: 'a', files: [], registryDependencies: ['b'] },
      { name: 'b', files: [], registryDependencies: ['a'] },
      { name: 'broken', files: [], registryDependencies: ['missing'] },
    ],
  };

  it('returns an empty list for a component without dependencies', () => {
    assert.deepEqual(resolveDependencies(registry, 'button'), []);
  });

  it('returns direct dependencies', () => {
    assert.deepEqual(resolveDependencies(registry, 'dropdown-menu'), ['overlay']);
  });

  it('resolves transitive dependencies once, dependencies first', () => {
    assert.deepEqual(resolveDependencies(registry, 'context-menu'), ['overlay', 'dropdown-menu']);
  });

  it('does not loop on circular dependencies', () => {
    assert.deepEqual(resolveDependencies(registry, 'a'), ['b']);
  });

  it('throws on a dependency missing from the registry', () => {
    assert.throws(() => resolveDependencies(registry, 'broken'), /Unknown registry dependency: "missing"/);
  });
});
