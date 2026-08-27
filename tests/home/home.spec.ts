// spec: specs/home.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Home Page', () => {
  test('Home page loads with all key sections visible', async ({ page }) => {
    const homePage = new HomePage(page);

    // 1. Navigate to https://automationexercise.com/ (fresh/blank browser state, no prior login or cart items).
    await homePage.gotoHome();
    await expect(page).toHaveTitle('Automation Exercise');
    await expect(homePage.logo).toBeVisible();

    const expectedNavLinks = [
      'Home',
      'Products',
      'Cart',
      'Signup / Login',
      'Test Cases',
      'API Testing',
      'Video Tutorials',
      'Contact us',
    ];
    const actualNavLinks = await homePage.header.getByRole('listitem').allTextContents();
    // Each nav item's visible text is prefixed by a decorative icon-font glyph (a private-use
    // Unicode code point rendered as an icon, not real text); strip anything outside the
    // printable ASCII range before comparing so the assertion targets the actual link labels.
    const cleanedNavLinks = actualNavLinks.map((text) => text.replace(/[^\x20-\x7E]/g, '').trim());
    expect(cleanedNavLinks).toEqual(expectedNavLinks);

    // 2. Scroll through the page from top to bottom without clicking anything.
    await homePage.scrollToBottom();

    await expect(homePage.carousel).toBeVisible();

    await expect(homePage.categorySidebarHeading).toBeVisible();
    await expect(homePage.categoryWomenLink).toBeVisible();
    await expect(homePage.categoryMenLink).toBeVisible();
    await expect(homePage.categoryKidsLink).toBeVisible();

    await expect(homePage.brandsHeading).toBeVisible();
    await expect(homePage.brandLinks.first()).toBeVisible();

    await expect(homePage.featuresItemsHeading).toBeVisible();
    await expect(homePage.firstProductPrice).toHaveText(/^Rs\. \d+$/);
    await expect(homePage.firstProductName).not.toBeEmpty();
    await expect(homePage.firstProductAddToCart).toBeVisible();
    await expect(homePage.firstProductViewProduct).toBeVisible();

    await expect(homePage.recommendedItemsHeading).toBeVisible();

    await expect(homePage.subscriptionHeading).toBeVisible();
    await expect(homePage.subscribeEmailInput).toBeVisible();
    await expect(homePage.subscribeEmailInput).toHaveAttribute('placeholder', 'Your email address');
    await expect(homePage.subscribeButton).toBeVisible();

    await expect(homePage.footerCopyright).toContainText('All rights reserved');
  });
});
