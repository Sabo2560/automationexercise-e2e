// spec: specs/navigation.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';
import { ProductsPage } from '../../pages/ProductsPage';
import { CartPage } from '../../pages/CartPage';
import { LoginPage } from '../../pages/LoginPage';

// The 8 static header nav locators (keyed by name) and their confirmed expected href, per
// Scenario 1's live findings. Shared across all 3 shallow pages checked below.
const EXPECTED_NAV_HREFS: Record<string, string> = {
  Home: '/',
  Products: '/products',
  Cart: '/view_cart',
  'Signup / Login': '/login',
  'Test Cases': '/test_cases',
  'API Testing': '/api_list',
  'Video Tutorials': 'https://www.youtube.com/c/AutomationExercise',
  'Contact us': '/contact_us',
};

/**
 * Assert all 8 static header nav locators inherited from BasePage are visible on the given
 * page object and each one's href exactly matches EXPECTED_NAV_HREFS.
 */
async function expectFullNavContract(basePage: BasePage) {
  const navLinksByName: Record<string, typeof basePage.homeNavLink> = {
    Home: basePage.homeNavLink,
    Products: basePage.productsNavLink,
    Cart: basePage.cartNavLink,
    'Signup / Login': basePage.signupLoginNavLink,
    'Test Cases': basePage.testCasesNavLink,
    'API Testing': basePage.apiTestingNavLink,
    'Video Tutorials': basePage.videoTutorialsNavLink,
    'Contact us': basePage.contactUsNavLink,
  };

  for (const [name, expectedHref] of Object.entries(EXPECTED_NAV_HREFS)) {
    const link = navLinksByName[name];
    await expect(link).toBeVisible();
    expect(await basePage.getHref(link)).toBe(expectedHref);
  }
}

test.describe('Cross-Page Nav Presence', () => {
  test('Header nav bar is present, complete, and identical across shallow (non-gated) pages', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const loginPage = new LoginPage(page);

    // 1. Assume a fresh, unauthenticated context. Navigate to /products via ProductsPage's own
    // goto method, read the accessible name and href of all 8 static nav locators, and assert
    // they are visible with the expected hrefs.
    await productsPage.gotoProducts();
    await expectFullNavContract(productsPage);

    // Navigate to /view_cart via CartPage.gotoCart(), and repeat the same 8-link assertion.
    await cartPage.gotoCart();
    await expectFullNavContract(cartPage);

    // Navigate to /login via LoginPage.gotoLogin(), and repeat the same 8-link assertion.
    await loginPage.gotoLogin();
    await expectFullNavContract(loginPage);
  });
});
