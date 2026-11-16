/**
 * @file The select inside an open nga-dialog, in Chromium, Firefox and WebKit:
 * pick with the mouse and with the keyboard, the first Escape closes only the
 * panel and the second closes the dialog. Run once with the Popover API (the
 * panel in the top layer) and once with it removed (the panel opens in place,
 * as in Firefox 119–124). The panel takes the global `.dark` colours. Light and
 * dark screenshots. Not part of CI.
 */

import { mkdir } from 'node:fs/promises';
import { expect, test, type Locator, type Page } from '@playwright/test';

const shots = '/Users/lazaro/OpenBot/Shared/ngatoms/screenshots/o-overlay';
const MODES = ['top-layer', 'fallback'] as const;
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

/** Puts the docs in a theme through the global `.dark` class on the root. */
async function useTheme(page: Page, theme: (typeof THEMES)[number]): Promise<void> {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if ((theme === 'dark') !== isDark) {
    await page.getByRole('button', { name: theme === 'dark' ? 'Switch to dark mode' : 'Switch to light mode' }).click();
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(theme === 'dark');
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

/** Opens the Usage dialog of the docs and returns it with its select trigger and the panel. */
async function openDialog(page: Page): Promise<{ dialog: Locator; trigger: Locator; panel: Locator }> {
  await page.getByRole('button', { name: 'Open dialog' }).first().click();
  const dialog = page.locator('dialog.nga-dialog[open]');
  await expect(dialog).toHaveCount(1);
  await settle(page);
  return { dialog, trigger: dialog.locator('.nga-select-trigger'), panel: dialog.locator('.nga-select-panel') };
}

test.beforeAll(async () => {
  await mkdir(shots, { recursive: true });
});

for (const mode of MODES) {
  test.describe(`select in a dialog (${mode})`, () => {
    test.beforeEach(async ({ page }) => {
      if (mode === 'fallback') {
        await page.addInitScript(() => {
          const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
          delete proto['showPopover'];
          delete proto['hidePopover'];
          delete proto['togglePopover'];
        });
      }
      await page.goto('/dialog');
    });

    test('picks with the mouse and the keyboard; Escape closes the panel, then the dialog', async ({ page }) => {
      expect(await page.evaluate(() => 'showPopover' in HTMLElement.prototype)).toBe(mode === 'top-layer');
      const { dialog, trigger, panel } = await openDialog(page);

      await trigger.click();
      await expect(panel).toBeVisible();
      expect(await panel.evaluate(element => element.closest('dialog') !== null), 'panel stays inside the dialog').toBe(true);
      expect(await panel.evaluate(element => element.hasAttribute('popover') && element.matches(':popover-open'))).toBe(mode === 'top-layer');
      expect(await isOnTop(panel)).toBe(true);
      await panel.getByRole('option', { name: 'Editor' }).click();
      await expect(panel).toHaveCount(0);
      await expect(trigger).toContainText('Editor');
      await expect(dialog).toHaveCount(1);

      await trigger.focus();
      await page.keyboard.press('ArrowDown');
      await expect(panel).toBeVisible();
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      await expect(panel).toHaveCount(0);
      await expect(trigger).toContainText('Admin');
      await expect(dialog).toHaveCount(1);

      await page.keyboard.press('ArrowDown');
      await expect(panel).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(panel).toHaveCount(0);
      await page.waitForTimeout(300);
      await expect(dialog, 'the first Escape leaves the dialog open').toHaveCount(1);
      await expect(trigger).toBeFocused();

      await page.keyboard.press('Escape');
      await expect(dialog, 'the second Escape closes the dialog').toHaveCount(0);
    });

    for (const theme of THEMES) {
      test(`the panel takes the global .dark colours (${theme})`, async ({ page }, info) => {
        await useTheme(page, theme);
        const { trigger, panel } = await openDialog(page);
        await trigger.click();
        await expect(panel).toBeVisible();
        await settle(page);
        const colours = await panel.evaluate(element => {
          const probe = document.createElement('div');
          probe.style.background = 'var(--nga-select-panel-bg)';
          probe.style.color = 'var(--nga-color-foreground)';
          document.body.appendChild(probe);
          const expected = { bg: getComputedStyle(probe).backgroundColor, fg: getComputedStyle(probe).color };
          probe.remove();
          const option = element.querySelector('.nga-select-option:not(.nga-select-option--selected)') as HTMLElement;
          return { bg: getComputedStyle(element).backgroundColor, fg: getComputedStyle(option).color, expected };
        });
        expect(colours.bg).toBe(colours.expected.bg);
        expect(colours.fg).toBe(colours.expected.fg);
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${shots}/dialog-select-${info.project.name}-${mode}-${theme}.png` });
      });
    }

    test('the panel colours follow the theme', async ({ page }) => {
      const read = async () => {
        const { trigger, panel } = await openDialog(page);
        await trigger.click();
        await expect(panel).toBeVisible();
        await settle(page);
        const bg = await panel.evaluate(element => getComputedStyle(element).backgroundColor);
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        await expect(page.locator('dialog.nga-dialog[open]')).toHaveCount(0);
        return bg;
      };
      await useTheme(page, 'dark');
      const dark = await read();
      await useTheme(page, 'light');
      const light = await read();
      expect(dark).not.toBe(light);
    });
  });
}
