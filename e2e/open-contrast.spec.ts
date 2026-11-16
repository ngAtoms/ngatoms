/**
 * @file Chromium contrast check of states that only exist while a panel is
 * open, which the page check misses: the select panel with a selected
 * option, the dropdown menu with its first item focused, the date picker
 * with a selected day, and the popover. axe color-contrast runs on the open
 * panel only, in light and dark. The gate is no failing node. Not part of CI.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const shots = '/Users/lazaro/OpenBot/Shared/ngatoms/screenshots/p-palette/open';
const THEMES = ['dark', 'light'] as const;

/** A panel to open on a docs page, and how to open it. */
interface OpenState {
  name: string;
  route: string;
  panel: string;
  open: (page: Page) => Promise<void>;
}

const STATES: OpenState[] = [
  {
    name: 'select-selected-option',
    route: 'select',
    panel: '.nga-select-panel',
    open: async page => {
      const trigger = page.locator('.nga-select-trigger').first();
      await trigger.click();
      await page.locator('.nga-select-option').nth(1).click();
      await trigger.click();
      await expect(page.locator('.nga-select-option--selected').first()).toBeVisible();
    },
  },
  {
    name: 'dropdown-menu-open',
    route: 'dropdown-menu',
    panel: '.nga-dropdown-panel--open',
    open: async page => {
      await page.locator('[ngAtomsDropdownTrigger]').first().focus();
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('.nga-dropdown-panel--open')).toBeVisible();
    },
  },
  {
    name: 'date-picker-selected-day',
    route: 'date-picker',
    panel: '.nga-date-picker-panel--open',
    open: async page => {
      const trigger = page.locator('.nga-date-picker-trigger').first();
      await trigger.click();
      const days = '.nga-date-picker-panel--open .nga-date-picker-day:not(.nga-date-picker-day--outside):not(.nga-date-picker-day--disabled)';
      await page.locator(days).nth(10).click();
      await trigger.click();
      await expect(page.locator('.nga-date-picker-panel--open .nga-date-picker-day--selected')).toBeVisible();
    },
  },
  {
    name: 'popover-open',
    route: 'popover',
    panel: '.nga-popover-panel',
    open: async page => {
      await page.locator('[ngAtomsPopoverTrigger]').first().click();
      await expect(page.locator('.nga-popover-panel').first()).toBeVisible();
    },
  },
];

/** Waits for finite animations and transitions, so the final colours are measured. */
async function settle(page: Page): Promise<void> {
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

/** Puts the docs in a theme; the page starts in dark. */
async function useTheme(page: Page, theme: (typeof THEMES)[number]): Promise<void> {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if ((theme === 'dark') !== isDark) {
    await page.getByRole('button', { name: theme === 'dark' ? 'Switch to dark mode' : 'Switch to light mode' }).click();
  }
  await settle(page);
}

/**
 * Text below 4.5:1 (3:1 when large) inside an open panel, measured by hand.
 * The panels are translucent over the docs' patterned page, so axe leaves
 * them incomplete; here the background is composited from each ancestor's
 * colour down to the first opaque one, ignoring the blur behind the panel.
 */
async function textContrast(page: Page, panel: string): Promise<string[]> {
  return page.locator(panel).first().evaluate(root => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    /** Any CSS colour as sRGB 0–255 and alpha 0–1. */
    const rgba = (color: string): number[] => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = '#000';
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };
    const luminance = (rgb: number[]) =>
      rgb
        .map(channel => channel / 255)
        .map(channel => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
        .reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0);

    const failing: string[] = [];
    for (const element of [root, ...root.querySelectorAll<HTMLElement>('*')] as HTMLElement[]) {
      const ownText = [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      if (!ownText || element.offsetParent === null) continue;
      const style = getComputedStyle(element);
      if (style.visibility === 'hidden' || Number(style.opacity) === 0) continue;

      const layers: number[][] = [];
      for (let node: HTMLElement | null = element; node; node = node.parentElement) {
        const layer = rgba(getComputedStyle(node).backgroundColor);
        if (layer[3] > 0) {
          layers.push(layer);
          if (layer[3] >= 1) break;
        }
      }
      let background = [255, 255, 255];
      for (const layer of layers.reverse()) background = background.map((value, i) => layer[i] * layer[3] + value * (1 - layer[3]));
      const text = rgba(style.color);
      const opacity = [...Array(8)].reduce<{ node: HTMLElement | null; value: number }>(
        acc => (acc.node && acc.node !== root.parentElement ? { node: acc.node.parentElement, value: acc.value * Number(getComputedStyle(acc.node).opacity) } : acc),
        { node: element, value: 1 },
      ).value;
      const alpha = text[3] * opacity;
      const foreground = background.map((value, i) => text[i] * alpha + value * (1 - alpha));
      const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      const ratio = (light + 0.05) / (dark + 0.05);
      const size = parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
      const disabled = element.closest('[aria-disabled="true"], [disabled], [class*="--disabled"]') !== null;
      if (!disabled && ratio < (large ? 3 : 4.5)) {
        failing.push(`${element.className.toString().split(' ')[0] || element.tagName} "${element.textContent?.trim().slice(0, 20)}" ${ratio.toFixed(2)}:1`);
      }
    }
    return failing;
  });
}

test('contrast of open panels: selected option, menu, selected day, popover', async ({ page }) => {
  test.setTimeout(300_000);
  await mkdir(shots, { recursive: true });
  const results: string[] = [];

  for (const theme of THEMES) {
    for (const state of STATES) {
      await page.goto(`/${state.route}`);
      await useTheme(page, theme);
      await state.open(page);
      await settle(page);
      await page.addScriptTag({ path: require.resolve('axe-core') });
      const nodes = await page.evaluate(async panel => {
        const axe = (
          window as unknown as {
            axe: {
              run: (
                context: unknown,
                options: unknown,
              ) => Promise<{
                violations: { nodes: { target: string[]; any: { data?: { contrastRatio?: number; fgColor?: string; bgColor?: string } | null }[] }[] }[];
              }>;
            };
          }
        ).axe;
        const result = await axe.run(
          { include: [[panel]] },
          { resultTypes: ['violations'], runOnly: { type: 'rule', values: ['color-contrast'] } },
        );
        return result.violations.flatMap(violation =>
          violation.nodes.map(node => {
            const data = node.any[0]?.data ?? {};
            return `${node.target.join(' ')} ${data.fgColor} on ${data.bgColor} ${data.contrastRatio}:1`;
          }),
        );
      }, state.panel);
      const measured = await textContrast(page, state.panel);
      const failing = [...nodes, ...measured];
      results.push(`${state.name}-${theme}: ${failing.length ? failing.join(' | ') : 'ok'}`);

      const box = await page.locator(state.panel).first().boundingBox();
      if (box) {
        const margin = 16;
        await page.screenshot({
          path: `${shots}/${state.name}-${theme}.png`,
          clip: { x: Math.max(0, box.x - margin), y: Math.max(0, box.y - margin), width: box.width + 2 * margin, height: box.height + 2 * margin },
        });
      }
    }
  }

  await writeFile(`${shots}/open-contrast-report.txt`, `${results.join('\n')}\n`);
  expect(results.filter(line => !line.endsWith(': ok')), results.join('\n')).toEqual([]);
});
