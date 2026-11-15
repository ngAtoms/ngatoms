import { createInterface } from 'readline';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { readConfig } from '../lib/config.js';
import {
  fetchRegistry,
  findComponent,
  listComponents,
  resolveDependencies,
  missingDependencyFiles,
  dependencyGapWarning,
} from '../lib/registry.js';
import { fetchText, getRawUrl } from '../lib/github.js';

async function confirm(rl, question) {
  return new Promise(resolve => {
    rl.question(`${question} (y/N) `, answer => {
      const trimmed = answer.trim().toLowerCase();
      resolve(trimmed === 'y' || trimmed === 'yes');
    });
  });
}

export function computeImportPath(stylesFile, componentsDir, componentName, cssImport) {
  const cssFullPath = join(componentsDir, componentName, cssImport);
  const rel = relative(dirname(stylesFile), cssFullPath);
  return rel.startsWith('..') ? rel : `./${rel}`;
}

export function patchStylesFile(stylesFilePath, importLine) {
  if (!existsSync(stylesFilePath)) return false;
  const existing = readFileSync(stylesFilePath, 'utf8');
  if (existing.includes(importLine)) return false;
  writeFileSync(stylesFilePath, existing + `\n${importLine}\n`, 'utf8');
  return true;
}

async function writeComponent(component, config, cwd, stylesFilePath) {
  const targetDir = join(cwd, config.componentsDir, component.name);
  mkdirSync(targetDir, { recursive: true });

  for (const filepath of component.files) {
    const content = await fetchText(getRawUrl(filepath));
    writeFileSync(join(targetDir, filepath.split('/').pop()), content, 'utf8');
  }

  // Style-less entries (e.g. overlay) have no cssImport.
  if (!component.cssImport) return { patched: false, importLine: null };

  const importPath = computeImportPath(
    config.stylesFile,
    config.componentsDir,
    component.name,
    component.cssImport
  );
  const importLine = `@import '${importPath}';`;
  return { patched: patchStylesFile(stylesFilePath, importLine), importLine };
}

export async function add(componentName, cwd = process.cwd()) {
  const config = readConfig(cwd);
  if (!config) {
    console.error('No ngatoms.json found. Run `npx ngatoms init` first.');
    process.exit(1);
  }

  if (!config.componentsDir || !config.stylesFile) {
    console.error('ngatoms.json is missing required fields. Re-run `npx ngatoms init`.');
    process.exit(1);
  }

  const registry = await fetchRegistry();
  const component = findComponent(registry, componentName);
  if (!component) {
    console.error(`Unknown component: "${componentName}"`);
    console.error(`Available: ${listComponents(registry).join(', ')}`);
    process.exit(1);
  }

  if (component.status === 'alpha') {
    console.log(`\x1b[48;5;220m\x1b[30m  ▲ ALPHA  \x1b[0m \x1b[38;5;220m"${componentName}" is in alpha — the API may change between versions.\x1b[0m`);
  } else if (component.status === 'stable') {
    console.log(`\x1b[48;5;46m\x1b[30m  ✔ STABLE  \x1b[0m \x1b[38;5;46m"${componentName}" is stable.\x1b[0m`);
  }

  const targetDir = join(cwd, config.componentsDir, componentName);
  if (existsSync(targetDir)) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const overwrite = await confirm(rl, `Component "${componentName}" already exists. Overwrite?`);
    rl.close();
    if (!overwrite) process.exit(0);
  }

  const stylesFilePath = join(cwd, config.stylesFile);

  // Dependencies first. An existing folder is never overwritten, so a
  // local edit to a shared piece (e.g. overlay) survives. If that folder
  // is missing a file this component imports, say so instead of failing
  // later in the consumer's build.
  const installedDeps = [];
  for (const depName of resolveDependencies(registry, componentName)) {
    const depDir = join(cwd, config.componentsDir, depName);
    const dep = findComponent(registry, depName);
    if (existsSync(depDir)) {
      const present = new Set(readdirSync(depDir));
      const warning = dependencyGapWarning(componentName, depName, missingDependencyFiles(dep.files, present));
      if (warning) console.warn(`⚠ ${warning}`);
      continue;
    }
    await writeComponent(dep, config, cwd, stylesFilePath);
    installedDeps.push(depName);
  }

  const { patched, importLine } = await writeComponent(component, config, cwd, stylesFilePath);

  console.log(`\n✓ Added ${componentName} to ${config.componentsDir}/${componentName}/`);
  if (installedDeps.length) {
    console.log(`✓ Added dependencies: ${installedDeps.join(', ')}`);
  }
  if (patched) {
    console.log(`✓ Updated ${config.stylesFile}`);
  } else if (importLine && !existsSync(stylesFilePath)) {
    console.warn(`⚠ Could not find ${config.stylesFile} — add the import manually:\n  ${importLine}`);
  }
}
