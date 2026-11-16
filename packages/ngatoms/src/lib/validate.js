import { isAbsolute, relative, resolve, sep } from 'path';

const NAME = /^[a-z0-9-]+$/;
const REGISTRY_FILE = /^packages\/[a-z0-9._/-]+$/;
const CSS_IMPORT = /^[a-z0-9.-]+\.css$/;

/** Throws unless `name` is a component name: lowercase letters, digits and dashes. */
export function assertName(name, what = 'component name') {
  if (typeof name !== 'string' || !NAME.test(name)) {
    throw new Error(`Refusing ${what} ${JSON.stringify(name)}: use lowercase letters, digits and dashes only.`);
  }
}

/** Throws unless `filepath` is a file under `packages/` with no `..`. */
export function assertRegistryFile(filepath) {
  if (typeof filepath !== 'string' || !REGISTRY_FILE.test(filepath) || filepath.includes('..')) {
    throw new Error(`Refusing registry file ${JSON.stringify(filepath)}: it must be a path under packages/.`);
  }
}

/** Throws unless `cssImport` is a plain `.css` file name. */
export function assertCssImport(cssImport) {
  if (typeof cssImport !== 'string' || !CSS_IMPORT.test(cssImport)) {
    throw new Error(`Refusing cssImport ${JSON.stringify(cssImport)}: it must be a .css file name.`);
  }
}

/** Throws when `target` resolves outside `base`. */
export function assertInside(base, target, what) {
  const rel = relative(resolve(base), resolve(target));
  if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) {
    throw new Error(`Refusing ${what}: ${target} is outside ${base}.`);
  }
}

/** Checks every name, dependency, file and cssImport of a registry; throws on the first bad one. */
export function validateRegistry(registry) {
  if (!registry || !Array.isArray(registry.components)) {
    throw new Error('Refusing registry: it has no components list.');
  }
  for (const component of registry.components) {
    assertName(component.name);
    for (const dep of component.registryDependencies ?? []) assertName(dep, 'registry dependency');
    if (!Array.isArray(component.files)) throw new Error(`Refusing registry entry "${component.name}": it has no files list.`);
    for (const filepath of component.files) assertRegistryFile(filepath);
    if (component.cssImport != null) assertCssImport(component.cssImport);
  }
  return registry;
}
