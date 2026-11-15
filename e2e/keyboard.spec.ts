/**
 * @file Chromium check of the stable keyboard patterns: accordion arrows and
 * Home/End, tabs Home/End, and dropdown items that follow the pointer with a
 * single highlight. Screenshots in light and dark. Not part of CI.
 */

import { mkdir } from 'node:fs/promises';
import { expect, test, type Locator, type Page } from '@playwright/test';

const shots = '/Users/lazaro/OpenBot/Shared/ngatoms/screenshots/k-keyboard';
const THEMES = ['dark', 'light'] as const;

/** Puts the docs in a theme; the page starts in dark. */
async function useTheme(page: Page, theme: (typeof THEMES)[number]): Promise<void> {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if ((theme === 'dark') !== isDark) {
    await page.getByRole('button', { name: theme === 'dark' ? 'Switch to dark mode' : 'Switch to light mode' }).click();
  }
  await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark).*$/);
}

/** Whether the focused element is the given one. */
async function hasFocus(locator: Locator): Promise<boolean> {
  return locator.evaluate(element => element === document.activeElement);
}

test.beforeAll(async () => {
  await mkdir(shots, { recursive: true });
});

for (const theme of THEMES) {
  test(`accordion: arrows and Home/End move between triggers (${theme})`, async ({ page }) => {
    await page.goto('/accordion');
    await useTheme(page, theme);
    const accordion = page.locator('nga-accordion').first();
    const triggers = accordion.locator(':scope > nga-accordion-item > [ngAtomsAccordionTrigger], :scope > nga-accordion-item .nga-accordion-trigger');
    const first = triggers.first();
    await first.scrollIntoViewIfNeeded();
    await first.focus();
    await page.keyboard.press('ArrowDown');
    expect(await hasFocus(triggers.nth(1))).toBe(true);
    await page.keyboard.press('End');
    expect(await hasFocus(triggers.last())).toBe(true);
    await page.screenshot({ path: `${shots}/accordion-end-${theme}.png` });
    await page.keyboard.press('Home');
    expect(await hasFocus(first)).toBe(true);
    await page.keyboard.press('Control+End');
    expect(await hasFocus(first)).toBe(true);
  });

  test(`tabs: Home and End switch the panel (${theme})`, async ({ page }) => {
    await page.goto('/tabs');
    await useTheme(page, theme);
    const tabs = page.locator('nga-tabs').first();
    const account = tabs.getByRole('tab', { name: 'Account' });
    const billing = tabs.getByRole('tab', { name: 'Billing' });
    await account.scrollIntoViewIfNeeded();
    await account.focus();
    await page.keyboard.press('End');
    await expect(billing).toHaveAttribute('aria-selected', 'true');
    expect(await hasFocus(billing)).toBe(true);
    await page.screenshot({ path: `${shots}/tabs-end-${theme}.png` });
    await page.keyboard.press('Home');
    await expect(account).toHaveAttribute('aria-selected', 'true');
    expect(await hasFocus(account)).toBe(true);
  });

  test(`dropdown: the item under the pointer takes focus, one highlight (${theme})`, async ({ page }) => {
    await page.goto('/dropdown-menu');
    await useTheme(page, theme);
    const menu = page.locator('nga-dropdown-menu').first();
    const trigger = menu.locator('[ngAtomsDropdownTrigger]');
    const items = page.locator('.nga-dropdown-panel--open .nga-dropdown-item');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(items.first()).toBeFocused();

    await items.nth(1).hover();
    await expect(items.nth(1)).toBeFocused();
    /**
     * Texts of the items with a visible background, and whether each has
     * focus; polled so the 120 ms background transition settles first.
     */
    const highlighted = () =>
      items.evaluateAll(elements =>
        elements
          .filter(element => {
            const background = getComputedStyle(element).backgroundColor;
            return !/^(transparent|rgba\(0, 0, 0, 0\)|oklab\([^)]*\/ 0\))$/.test(background);
          })
          .map(element => `${element.textContent?.trim()}:${element === document.activeElement}`),
      );
    await expect.poll(highlighted, { timeout: 2000 }).toEqual(['Duplicate:true']);
    await page.screenshot({ path: `${shots}/dropdown-hover-${theme}.png` });
    await page.locator('.nga-dropdown-panel--open').screenshot({ path: `${shots}/dropdown-panel-${theme}.png` });

    /** The pointer stays on Duplicate while the arrows move on: only the focused item keeps the highlight. */
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(2)).toBeFocused();
    expect(await items.nth(1).evaluate(element => element.matches(':hover'))).toBe(true);
    await expect.poll(highlighted, { timeout: 2000 }).toEqual(['Delete:true']);
    await page.locator('.nga-dropdown-panel--open').screenshot({ path: `${shots}/dropdown-keys-after-hover-${theme}.png` });
  });

  test(`tabs: a disabled tab is skipped and never holds the tab stop (${theme})`, async ({ page }) => {
    await page.goto('/tabs');
    await useTheme(page, theme);
    const section = page.locator('#underline');
    const tab = (name: string) => section.getByRole('tab', { name });
    await tab('Account').scrollIntoViewIfNeeded();
    await tab('Account').focus();

    await page.keyboard.press('End');
    await expect(tab('Notifications')).toBeFocused();
    await expect(tab('Notifications')).toHaveAttribute('aria-selected', 'true');
    await expect(tab('Billing')).toHaveAttribute('aria-selected', 'false');
    await expect(tab('Billing')).toHaveAttribute('tabindex', '-1');
    await expect(section.getByRole('tabpanel').filter({ visible: true })).toHaveCount(1);
    await page.screenshot({ path: `${shots}/tabs-disabled-end-${theme}.png` });

    await page.keyboard.press('ArrowRight');
    await expect(tab('Account')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(tab('Notifications')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(tab('Notifications')).not.toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(tab('Notifications')).toBeFocused();
  });
}
