import { fetchText, getRawUrl } from './github.js';

export async function fetchRegistry() {
  const url = getRawUrl('registry/registry.json');
  const text = await fetchText(url);
  return JSON.parse(text);
}

export function findComponent(registry, name) {
  return registry.components.find(c => c.name === name) ?? null;
}

export function listComponents(registry) {
  return registry.components.map(c => c.name);
}

/**
 * Returns the components `name` depends on (transitively), dependencies
 * first, without duplicates and without `name` itself. Unknown dependency
 * names throw so a broken registry entry fails loudly instead of leaving
 * the consumer with a dangling import.
 */
export function resolveDependencies(registry, name) {
  const ordered = [];
  const seen = new Set([name]);

  const visit = componentName => {
    const component = findComponent(registry, componentName);
    if (!component) throw new Error(`Unknown registry dependency: "${componentName}"`);
    for (const dep of component.registryDependencies ?? []) {
      if (seen.has(dep)) continue;
      seen.add(dep);
      visit(dep);
      ordered.push(dep);
    }
  };

  visit(name);
  return ordered;
}
