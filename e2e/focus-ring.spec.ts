/**
 * @file Chromium check that the keyboard focus ring of each stable control is
 * visible: the ring colour, composited over what it sits on, keeps at least
 * 3:1 against the adjacent background, in light and dark. The ring is read
 * from the computed style (the solid box-shadow with the widest spread, or
 * the outline); an inset ring is measured against the control's own
 * background. In the grid, focus lands on the active cell, which draws the ring. Screenshots of each focused control. Not part of CI.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const shots = '/Users/lazaro/OpenBot/Shared/ngatoms/screenshots/p-palette/focus';
const THEMES = ['dark', 'light'] as const;

/** A control to focus: its page, the element that takes focus, and the one that draws the ring. */
interface Control {
  route: string;
  focus: string;
  ring?: string;
}

const CONTROLS: Control[] = [
  { route: 'button', focus: '.nga-btn' },
  { route: 'input', focus: '.nga-input' },
  { route: 'textarea', focus: '.nga-textarea' },
  { route: 'select', focus: '.nga-select-trigger' },
  { route: 'number-input', focus: '.nga-number-input input', ring: '.nga-number-input' },
  { route: 'checkbox', focus: '.nga-checkbox' },
  { route: 'radio-group', focus: '.nga-radio' },
  { route: 'switch', focus: '.nga-switch' },
  { route: 'tabs', focus: '.nga-tab-trigger--active' },
  { route: 'accordion', focus: '.nga-accordion-trigger' },
  { route: 'date-picker', focus: '.nga-date-picker-trigger' },
  { route: 'grid', focus: '.nga-grid__viewport', ring: '.nga-grid__cell--active' },
  { route: 'input', focus: '.nga-input--invalid' },
  { route: 'grid', focus: '.nga-grid__header-filter' },
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

/** Contrast of the focus ring of an element against what is next to it, worked out in the page. */
async function ringContrast(page: Page, control: Control): Promise<{ ratio: number; ring: string } | null> {
  const element = page.locator(control.focus).first();
  return element.evaluate((focused, ringSelector) => {
    const target = (ringSelector ? (focused.closest(ringSelector) ?? document.querySelector(ringSelector)) : focused) as HTMLElement;
    const style = getComputedStyle(target);

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

    let ringColor: string | null = null;
    let inset = false;
    if (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) {
      ringColor = style.outlineColor;
      inset = parseFloat(style.outlineOffset) < 0;
    } else {
      const shadows: string[] = [];
      let depth = 0;
      let current = '';
      for (const char of style.boxShadow) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (char === ',' && depth === 0) {
          shadows.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      if (current.trim()) shadows.push(current.trim());
      let widest = 0;
      for (const shadow of shadows) {
        if (shadow === 'none') continue;
        const color = shadow.match(/^((?:rgba?|oklab|oklch|lab|lch|color)\([^)]*\)|#[0-9a-f]+)/i)?.[0];
        if (!color) continue;
        const lengths = shadow.slice(color.length).replace('inset', '').trim().split(/\s+/).map(parseFloat);
        const blur = lengths[2] ?? 0;
        const spread = lengths[3] ?? 0;
        if (blur === 0 && spread > widest) {
          widest = spread;
          ringColor = color;
          inset = /\binset\b/.test(shadow);
        }
      }
    }
    if (!ringColor) return null;

    const layers: number[][] = [];
    for (let node: HTMLElement | null = inset ? target : target.parentElement; node; node = node.parentElement) {
      const layer = rgba(getComputedStyle(node).backgroundColor);
      if (layer[3] > 0) {
        layers.push(layer);
        if (layer[3] >= 1) break;
      }
    }
    let background = [255, 255, 255];
    for (const layer of layers.reverse()) background = background.map((value, i) => layer[i] * layer[3] + value * (1 - layer[3]));
    const ring = rgba(ringColor);
    let opacity = 1;
    for (let node: HTMLElement | null = target; node; node = node.parentElement) {
      opacity *= Number(getComputedStyle(node).opacity);
    }
    const alpha = ring[3] * opacity;
    const ringOver = background.map((value, i) => ring[i] * alpha + value * (1 - alpha));

    const luminance = (rgb: number[]) =>
      rgb
        .map(channel => channel / 255)
        .map(channel => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
        .reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0);
    const [light, dark] = [luminance(ringOver), luminance(background)].sort((a, b) => b - a);
    return { ratio: Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100, ring: ringColor };
  }, control.ring ?? null);
}

test('the focus ring of each stable control keeps 3:1 against its background', async ({ page }) => {
  test.setTimeout(300_000);
  await mkdir(shots, { recursive: true });
  const results: string[] = [];

  for (const theme of THEMES) {
    for (const control of CONTROLS) {
      await page.goto(`/${control.route}`);
      await useTheme(page, theme);
      const element = page.locator(control.focus).first();
      await element.scrollIntoViewIfNeeded();
      await page.keyboard.press('Tab');
      await element.focus();
      if (control.ring) await page.locator(control.ring).first().waitFor();
      await settle(page);
      const measured = await ringContrast(page, control);
      const name = `${control.route}${control.focus.replace(/[^a-z-]+/gi, '_')}-${theme}`;
      const box = await page.locator(control.ring ?? control.focus).first().boundingBox();
      if (box) {
        const margin = 16;
        await page.screenshot({
          path: `${shots}/${name}.png`,
          clip: { x: Math.max(0, box.x - margin), y: Math.max(0, box.y - margin), width: box.width + 2 * margin, height: box.height + 2 * margin },
        });
      }
      results.push(`${name}: ${measured ? `${measured.ratio}:1 (${measured.ring})` : 'no ring'}`);
    }
  }

  await writeFile(`${shots}/focus-ring-report.txt`, `${results.join('\n')}\n`);
  const failing = results.filter(line => line.endsWith('no ring') || Number(line.match(/: ([\d.]+):1/)?.[1]) < 3);
  expect(failing, results.join('\n')).toEqual([]);
});
