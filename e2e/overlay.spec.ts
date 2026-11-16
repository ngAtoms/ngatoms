/**
 * @file Chromium check of the overlay slice: the select panel opens in the
 * top layer, so a scroll container cannot clip it; editors open with defaultOpen;
 * Escape gives focus back to the trigger; the panel follows a page scroll.
 * Light and dark, with screenshots. Not part of CI.
 */

import { mkdir } from 'node:fs/promises';
import { expect, test, type Locator, type Page } from '@playwright/test';

const shots = '/Users/lazaro/OpenBot/Shared/ngatoms/screenshots/o-overlay';
const THEMES = ['dark', 'light'] as const;

/** Waits for finite animations and transitions to end. */
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

/** Whether the centre of an element is the topmost thing there, so nothing clips or covers it. */
async function isOnTop(locator: Locator): Promise<boolean> {
  return locator.evaluate(element => {
    const box = element.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return !!hit && element.contains(hit);
  });
}

/** Screenshot of an element with a margin around it. */
async function shoot(page: Page, locator: Locator, file: string): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) return;
  const margin = 24;
  await page.screenshot({
    path: `${shots}/${file}`,
    clip: { x: Math.max(0, box.x - margin), y: Math.max(0, box.y - margin), width: box.width + 2 * margin, height: box.height + 2 * margin },
  });
}

test.beforeAll(async () => {
  await mkdir(shots, { recursive: true });
});

for (const theme of THEMES) {
  test(`select editor in a grid cell opens whole, in the top layer (${theme})`, async ({ page }) => {
    await page.goto('/grid');
    await useTheme(page, theme);
    const grid = page.locator('#templates nga-grid');
    const status = grid.locator('[role="gridcell"]', { hasText: 'In progress' }).first();
    await status.scrollIntoViewIfNeeded();
    await status.dblclick();
    const panel = page.locator('.nga-select-panel');
    await expect(panel).toBeVisible();
    await settle(page);
    expect(await panel.evaluate(element => element.matches(':popover-open') && element.closest('nga-select') !== null)).toBe(true);
    expect(await isOnTop(panel)).toBe(true);
    const box = await panel.boundingBox();
    const view = page.viewportSize()!;
    expect(box!.y + box!.height).toBeLessThanOrEqual(view.height);
    await shoot(page, panel, `grid-select-editor-${theme}.png`);
  });

  test(`date picker editor in a grid cell opens with defaultOpen (${theme})`, async ({ page }) => {
    await page.goto('/grid');
    await useTheme(page, theme);
    const grid = page.locator('#templates nga-grid');
    const due = grid.locator('[role="gridcell"]', { hasText: /^\s*2026-11-03\s*$/ }).first();
    await due.scrollIntoViewIfNeeded();
    await due.dblclick();
    const calendar = page.locator('.nga-date-picker-panel--open');
    await expect(calendar).toBeVisible();
    await settle(page);
    expect(await calendar.evaluate(element => element.matches(':popover-open'))).toBe(true);
    expect(await isOnTop(calendar)).toBe(true);
    await shoot(page, calendar, `grid-date-editor-${theme}.png`);
  });

  test(`select: Escape gives focus back to the trigger, and the panel follows a page scroll (${theme})`, async ({ page }) => {
    await page.goto('/select');
    await useTheme(page, theme);
    const trigger = page.locator('.nga-select-trigger').first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const panel = page.locator('.nga-select-panel');
    await expect(panel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(panel).toBeVisible();
    await page.mouse.move(1100, 820);
    const before = await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
    await page.mouse.wheel(0, 200);
    await expect.poll(() => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBeGreaterThan(before + 100);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve(null))));
    const t = (await trigger.boundingBox())!;
    const p = (await panel.boundingBox())!;
    const gap = Math.min(Math.abs(p.y - (t.y + t.height)), Math.abs(t.y - (p.y + p.height)));
    expect(gap, `panel ${gap}px from its trigger after a page scroll`).toBeLessThanOrEqual(8);
    await shoot(page, panel, `select-after-scroll-${theme}.png`);
  });
}
