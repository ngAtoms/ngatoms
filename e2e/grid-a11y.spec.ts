/**
 * Chromium check of /grid: color contrast on, plus the filter list scroll.
 * jsdom cannot paint, so the unit axe leaves color-contrast off.
 * The gate is the grids and the filter panel; docs chrome outside them is
 * reported, not gated. Screen readers are out of scope. Not part of CI.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const shots = '/Users/lazaro/OpenBot/Shared/ngatoms/screenshots/grid-v1';

/**
 * One failing node: where it is on the page and who styles it. `template`
 * is markup the app passes in a cell template (a badge, a link), drawn
 * inside the grid but not styled by it.
 */
interface AxeNode {
  rule: string;
  target: string;
  section: string;
  owner: 'grid' | 'template' | 'docs';
  ratio: number | null;
}

async function injectAxe(page: Page): Promise<void> {
  await page.addScriptTag({ path: require.resolve('axe-core') });
}

/** Runs axe over the whole page with color-contrast on. */
async function axeNodes(page: Page): Promise<AxeNode[]> {
  return page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            context: Document,
            options: unknown,
          ) => Promise<{
            violations: {
              id: string;
              nodes: { target: string[]; any: { data?: { contrastRatio?: number } | null }[] }[];
            }[];
          }>;
        };
      }
    ).axe;
    const result = await axe.run(document, {
      resultTypes: ['violations'],
      rules: { 'color-contrast': { enabled: true } },
    });
    return result.violations.flatMap((violation) =>
      violation.nodes.map((node) => {
        const target = node.target.join(' ');
        const element = document.querySelector(target);
        const inTemplate = !!element?.parentElement?.closest('.nga-grid__cell-value');
        const inGrid = !!element?.closest('nga-grid, .nga-grid-filter');
        return {
          rule: violation.id,
          target,
          section: element?.closest('section[id]')?.id ?? (element?.closest('.nga-grid-filter') ? 'filter-panel' : 'page'),
          owner: inTemplate ? ('template' as const) : inGrid ? ('grid' as const) : ('docs' as const),
          ratio: node.any[0]?.data?.contrastRatio ?? null,
        };
      }),
    );
  });
}

/** Counts per section and rule, plus the contrast nodes themselves. */
function report(nodes: AxeNode[]) {
  const bySection: Record<string, Record<string, number>> = {};
  for (const node of nodes) {
    const section = (bySection[node.section] ??= {});
    section[node.rule] = (section[node.rule] ?? 0) + 1;
  }
  const contrast = nodes.filter((node) => node.rule === 'color-contrast');
  return {
    gridContrast: contrast.filter((node) => node.owner === 'grid'),
    outsideGridContrast: contrast.filter((node) => node.owner !== 'grid'),
    bySection,
  };
}

test('grid page contrast, focus, selection and filter scroll', async ({ page }) => {
  await mkdir(shots, { recursive: true });
  await page.goto('/grid');
  const stock = page.locator('#filters nga-grid');
  await expect(stock.locator('[role="gridcell"]').first()).toBeVisible();
  await page.locator('#filters').scrollIntoViewIfNeeded();
  await injectAxe(page);

  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({ path: `${shots}/dark.png` });
  const dark = report(await axeNodes(page));
  await writeFile(`${shots}/axe-dark.json`, JSON.stringify(dark, null, 2));

  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.locator('#filters').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${shots}/light.png` });
  const light = report(await axeNodes(page));
  await writeFile(`${shots}/axe-light.json`, JSON.stringify(light, null, 2));

  const gridSection = await page
    .locator('.sidebar-nav a[href="/grid"]')
    .evaluate((link) => {
      let node = link.previousElementSibling;
      while (node && !node.classList.contains('nav-section')) node = node.previousElementSibling;
      return node?.textContent?.trim() ?? null;
    });
  expect(gridSection).toBe('Data');
  await page.locator('#sidebar-nav').screenshot({ path: `${shots}/sidebar.png` });

  const cell = stock.locator('[role="gridcell"]').first();
  await cell.click();
  await expect(cell).toHaveClass(/nga-grid__cell--active/);
  await page.screenshot({ path: `${shots}/focus.png` });

  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.up('Shift');
  await expect(stock.locator('[aria-selected="true"]')).not.toHaveCount(1);
  await page.screenshot({ path: `${shots}/selection.png` });

  await stock.getByRole('button', { name: 'Filter Category' }).click();
  const panel = page.locator('.nga-grid-filter');
  const list = panel.locator('.nga-grid-filter__options');
  await expect(list).toBeVisible();
  await page.screenshot({ path: `${shots}/filter-open.png` });
  const filterLight = report(await axeNodes(page)).gridContrast.filter((node) => node.section === 'filter-panel');

  const scrolled = await list.evaluate((el) => {
    el.style.maxHeight = '40px';
    const before = el.scrollTop;
    el.scrollTop = el.scrollHeight;
    return {
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      before,
      after: el.scrollTop,
    };
  });
  expect(scrolled.scrollHeight).toBeGreaterThan(scrolled.clientHeight);
  expect(scrolled.after).toBeGreaterThan(scrolled.before);
  await expect(panel).toBeVisible();
  await expect(panel).toBeAttached();

  // R1: a page scroll with the panel open keeps it under its button.
  const filterButton = stock.getByRole('button', { name: 'Filter Category' });
  /** Distance between the panel and the button edge it hangs from. */
  const panelGap = async () => {
    const button = await filterButton.boundingBox();
    const box = await panel.boundingBox();
    if (!button || !box) throw new Error('filter button or panel has no box');
    return Math.min(Math.abs(box.y - (button.y + button.height)), Math.abs(button.y - (box.y + box.height)));
  };
  const gapBefore = await panelGap();
  const scrollBefore = await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
  await page.mouse.move(700, 120);
  await page.mouse.wheel(0, 300);
  await expect
    .poll(() => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0))
    .toBeGreaterThan(scrollBefore + 200);
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => done(null))));
  await expect(panel).toBeVisible();
  const gapAfter = await panelGap();
  await page.screenshot({ path: `${shots}/filter-page-scroll.png` });
  expect(gapBefore).toBeLessThanOrEqual(8);
  expect(gapAfter, `panel ${gapAfter}px from its button after a page scroll`).toBeLessThanOrEqual(8);

  const summary = {
    gridContrast: { dark: dark.gridContrast.length, light: light.gridContrast.length, filterPanelLight: filterLight.length },
    outsideGridContrast: { dark: dark.outsideGridContrast.length, light: light.outsideGridContrast.length },
  };
  await writeFile(`${shots}/axe-summary.json`, JSON.stringify(summary, null, 2));
  const gridNodes = summary.gridContrast.dark + summary.gridContrast.light + summary.gridContrast.filterPanelLight;
  expect(gridNodes, JSON.stringify(summary)).toBe(0);
});

test('Alt+↓ / Alt+↑ move an expanded phase past its sibling in the task demo', async ({ page }) => {
  await page.goto('/grid');
  const section = page.locator('#templates');
  const grid = section.locator('nga-grid');
  const design = grid.locator('[role="row"][aria-level="1"] [role="rowheader"]', { hasText: 'Design' });
  await design.scrollIntoViewIfNeeded();
  await design.click();

  /** Phase rows in display order. */
  const phases = () =>
    grid.locator('[role="row"][aria-level="1"] [role="rowheader"]').evaluateAll((cells) =>
      cells.map((cell) => cell.textContent?.trim()),
    );
  const before = await phases();
  expect(before.indexOf('Design')).toBeLessThan(before.indexOf('Build'));

  await page.keyboard.press('Alt+ArrowDown');
  await expect(section.locator('.demo-note')).toHaveText('design moved after build');
  await expect.poll(async () => (await phases()).indexOf('Design')).toBeGreaterThan((await phases()).indexOf('Build'));
  await expect(grid.locator('.nga-grid__cell--active')).toContainText('Design');
  await page.screenshot({ path: `${shots}/task-alt-down.png` });

  await page.keyboard.press('Alt+ArrowUp');
  await expect(section.locator('.demo-note')).toHaveText('design moved before build');
  await expect.poll(phases).toEqual(before);
  await expect(grid.locator('.nga-grid__cell--active')).toContainText('Design');
});

test('K1: Ctrl jumps keep focus in the grid and arrows do not scroll the page', async ({ page }) => {
  await page.goto('/grid');
  const grid = page.locator('#simple nga-grid');
  const firstCell = grid.locator('[role="rowheader"], [role="gridcell"]').first();
  await expect(firstCell).toBeVisible();
  await firstCell.scrollIntoViewIfNeeded();
  await firstCell.click();

  const focusInGrid = () =>
    page.evaluate(() => !!document.activeElement?.closest('#simple nga-grid'));
  const pageScroll = () => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
  const activeRow = () =>
    grid.locator('.nga-grid__cell--active').evaluate((cell) => cell.closest('[role="row"]')?.getAttribute('aria-rowindex'));

  for (const keys of ['Control+ArrowDown', 'Control+Home', 'Control+End', 'Control+ArrowUp']) {
    await page.keyboard.press(keys);
    await expect.poll(focusInGrid, keys).toBe(true);
  }
  await page.keyboard.press('Control+ArrowDown');
  await expect.poll(focusInGrid).toBe(true);
  await expect.poll(async () => Number(await activeRow())).toBeGreaterThan(100);
  const bottomRow = Number(await activeRow());
  const before = await pageScroll();
  await page.keyboard.press('ArrowUp');
  await expect.poll(async () => Number(await activeRow())).toBe(bottomRow - 1);
  await expect.poll(focusInGrid).toBe(true);
  expect(await pageScroll()).toBe(before);
  await page.screenshot({ path: `${shots}/ctrl-down-focus.png` });
});
