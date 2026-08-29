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

test.describe('Scroll-to-Top Button (scenario 1.6)', () => {
  test('Scroll-to-top button appears on scroll and returns the page to the top', async ({ page }) => {
    const homePage = new HomePage(page);

    // 1. On a freshly loaded home page, confirm the scroll-to-top button (#scrollUp) is present
    // in the DOM but not visible (CSS display equals 'none') before any scrolling occurs.
    await homePage.gotoHome();
    await expect(homePage.scrollToTopButton).not.toBeVisible();
    expect(
      await homePage.scrollToTopButton.evaluate((el) => getComputedStyle(el).display),
    ).toBe('none');

    // 2. Scroll the page down by at least 2000px.
    await homePage.scrollToBottom();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(2000);

    // 3. Confirm #scrollUp's computed display style equals 'block' (control becomes visible)
    // once window.scrollY exceeds the reveal threshold.
    await expect(homePage.scrollToTopButton).toBeVisible();
    expect(
      await homePage.scrollToTopButton.evaluate((el) => getComputedStyle(el).display),
    ).toBe('block');

    // 4. Click the now-visible scroll-to-top button and wait for the scroll animation to
    // complete. This is a distinct interaction path (clicking the arrow control itself) from
    // scrollToTopManually(), which deliberately never touches the button.
    await homePage.scrollToTopButton.click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY), {
        message: 'window.scrollY should settle back to 0 after clicking #scrollUp',
        timeout: 10_000,
      })
      .toBe(0);

    // expect: window.scrollY equals 0 after the animation finishes, i.e. the page has returned
    // exactly to the top.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});
