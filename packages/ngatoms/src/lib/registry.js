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

/** Basename of a registry file path. */
export function registryBasename(filepath) {
  const slash = filepath.lastIndexOf('/');
  return slash === -1 ? filepath : filepath.slice(slash + 1);
}

/**
 * Files a dependency lists that are not already in its folder.
 * The caller leaves the folder untouched and only warns.
 *
 * @param files Registry paths of the dependency.
 * @param present Basenames found in the existing folder.
 * @returns Basenames that are missing.
 */
export function missingDependencyFiles(files, present) {
  return files.map(registryBasename).filter(name => !present.has(name));
}

/**
 * Warning when an existing dependency folder is missing files the
 * component being added needs. Null when nothing is missing.
 *
 * @returns A sentence such as `overlay already exists; grid needs overlay/position.ts`.
 */
export function dependencyGapWarning(componentName, depName, missing) {
  if (missing.length === 0) return null;
  const list = missing.map(name => `${depName}/${name}`).join(', ');
  return `${depName} already exists; ${componentName} needs ${list}`;
}
