/**
 * @file Chromium contrast check of every stable component page, in light and
 * dark: axe color-contrast on the whole page. A failing node is "lib" when it
 * sits in an element with an `nga-*` class (a library component) and "docs"
 * otherwise. The gate is no lib node; docs nodes are reported. Full-page
 * screenshots go to a folder per phase (PAGES_PHASE=before|after). Not in CI.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const phase = process.env['PAGES_PHASE'] ?? 'after';
const shots = `/Users/lazaro/OpenBot/Shared/ngatoms/screenshots/p-palette/${phase}`;
const THEMES = ['dark', 'light'] as const;

/** Stable registry components that have a docs page, plus the get-started page. */
async function stableRoutes(): Promise<string[]> {
  const registry = JSON.parse(await readFile(path.join(process.cwd(), 'registry/registry.json'), 'utf8')) as {
    components: { name: string; status?: string }[];
  };
  const pages = registry.components
    .filter(component => component.status === 'stable' && component.name !== 'overlay')
    .map(component => component.name)
    .sort();
  return ['get-started', ...pages];
}

/** Puts the docs in a theme; the page starts in dark. */
async function useTheme(page: Page, theme: (typeof THEMES)[number]): Promise<void> {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if ((theme === 'dark') !== isDark) {
    await page.getByRole('button', { name: theme === 'dark' ? 'Switch to dark mode' : 'Switch to light mode' }).click();
  }
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
    .toBe(theme === 'dark');
  await settleTransitions(page);
}

/**
 * Waits for the colour transitions a theme switch starts, so axe measures the
 * final colours. Endless animations (spinners, indeterminate bars) are ignored.
 */
async function settleTransitions(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .filter(animation => animation.effect?.getTiming().iterations !== Infinity)
        .every(animation => animation.playState !== 'running'),
    undefined,
    { timeout: 5_000 },
  );
}

/** One failing node: who styles it, where it is, and its ratio. */
interface ContrastNode {
  owner: 'lib' | 'docs';
  target: string;
  ratio: number | null;
}

/** Runs axe color-contrast on the page and classifies each failing node. */
async function contrastNodes(page: Page): Promise<ContrastNode[]> {
  return page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            context: Document,
            options: unknown,
          ) => Promise<{
            violations: { nodes: { target: string[]; any: { data?: { contrastRatio?: number } | null }[] }[] }[];
          }>;
        };
      }
    ).axe;
    const result = await axe.run(document, {
      resultTypes: ['violations'],
      runOnly: { type: 'rule', values: ['color-contrast'] },
    });
    return result.violations.flatMap(violation =>
      violation.nodes.map(node => {
        const target = node.target.join(' ');
        let element: Element | null = document.querySelector(target);
        let owner: 'lib' | 'docs' = 'docs';
        while (element) {
          if ([...element.classList].some(name => name.startsWith('nga-'))) {
            owner = 'lib';
            break;
          }
          element = element.parentElement;
        }
        return { owner, target, ratio: node.any[0]?.data?.contrastRatio ?? null };
      }),
    );
  });
}

test('contrast of the stable component pages, light and dark', async ({ page }) => {
  test.setTimeout(600_000);
  await mkdir(shots, { recursive: true });
  const report: Record<string, Record<string, { lib: ContrastNode[]; docs: number }>> = {};

  for (const route of await stableRoutes()) {
    await page.goto(`/${route}`);
    await page.addScriptTag({ path: require.resolve('axe-core') });
    report[route] = {};
    for (const theme of THEMES) {
      await useTheme(page, theme);
      await page.evaluate(() => window.scrollTo(0, 0));
      const nodes = await contrastNodes(page);
      report[route][theme] = {
        lib: nodes.filter(node => node.owner === 'lib'),
        docs: nodes.filter(node => node.owner === 'docs').length,
      };
      await page.screenshot({ path: `${shots}/${route}-${theme}.png`, fullPage: true });
    }
  }

  await writeFile(`${shots}/contrast-report.json`, JSON.stringify(report, null, 2));
  const libNodes = Object.values(report).flatMap(themes => Object.values(themes).flatMap(result => result.lib));
  expect(libNodes, JSON.stringify(libNodes.slice(0, 20), null, 2)).toEqual([]);
});
