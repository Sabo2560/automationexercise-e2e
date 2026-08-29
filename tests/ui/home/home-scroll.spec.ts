// spec: specs/home.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';

test.describe('Plain Browser Scroll (TC26 audit gap)', () => {
  test('Plain browser scroll (wheel/keyboard/window.scrollTo) moves the page down and back up correctly, independent of the #scrollUp arrow control', async ({
    page,
  }) => {
    const homePage = new HomePage(page);

    // 1. On a freshly loaded home page, read the starting scroll position. This scenario must
    // never click or otherwise interact with the '#scrollUp' button at any point.
    await homePage.gotoHome();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // 2. Using only native scroll mechanics (page.mouse.wheel and/or window.scrollTo), scroll
    // the page down until window.scrollY is at least 2000.
    await homePage.scrollToBottom();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(2000);

    // 3. Still without ever clicking '#scrollUp', scroll the page back up using only native
    // scroll mechanics (page.mouse.wheel and/or window.scrollTo).
    await homePage.scrollToTopManually();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});
