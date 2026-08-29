// spec: specs/navigation.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { ProductsPage } from '../../pages/ProductsPage';
import { CartPage } from '../../pages/CartPage';
import { LoginPage } from '../../pages/LoginPage';
import { ContactUsPage } from '../../pages/ContactUsPage';

test.describe('Static Header Nav Contract', () => {
  test('Internal header nav links navigate to their correct destinations', async ({ page }) => {
    // This scenario performs 13 full-page navigations (6x gotoHome + ~7 nav-link clicks) against
    // the live site in a single test. Firefox's per-navigation "load" event timing on this site
    // runs measurably slower than chromium/webkit, so the cumulative sequence can bump into the
    // default 30s test-level timeout in its back half even though each individual navigation is
    // behaving correctly (confirmed: failure point drifts across runs -- always mid/late sequence,
    // never the first couple of navigations). Extend this test's own timeout rather than the
    // global config, which is scoped to this file's unusually heavy navigation volume only.
    test.setTimeout(90_000);

    const homePage = new HomePage(page);
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const loginPage = new LoginPage(page);
    const contactUsPage = new ContactUsPage(page);

    // 1. Assume a fresh, unauthenticated browser context. Instantiate HomePage and navigate to '/' via homePage.gotoHome().
    await homePage.gotoHome();
    await expect(page).toHaveURL('/');
    await expect(homePage.featuresItemsHeading).toBeVisible();

    // 2(a) Products -> productsNavLink, expected URL /products, expected signal: title contains
    // 'All Products' AND ProductsPage.allProductsHeading visible.
    await homePage.clickNavAndExpectUrl(homePage.productsNavLink, /\/products$/);
    await expect(page).toHaveURL('/products');
    await expect(page).toHaveTitle(/All Products/);
    await expect(productsPage.allProductsHeading).toBeVisible();

    // 2(g) Home -> homeNavLink clicked from a DIFFERENT page (immediately after the Products
    // sub-case above, before returning Home again), expected URL /, expected signal:
    // HomePage.featuresItemsHeading visible.
    await homePage.clickNavAndExpectUrl(homePage.homeNavLink, /\/$/);
    await expect(page).toHaveURL('/');
    await expect(homePage.featuresItemsHeading).toBeVisible();

    // 2(b) Cart -> cartNavLink, expected URL /view_cart, expected signal: CartPage's cart table
    // OR empty-cart message becomes visible (whichever the current cart state renders).
    await homePage.gotoHome();
    await homePage.clickNavAndExpectUrl(homePage.cartNavLink, /\/view_cart$/);
    await expect(page).toHaveURL('/view_cart');
    await Promise.race([
      cartPage.cartTable.waitFor({ state: 'visible' }),
      cartPage.emptyCartMessage.waitFor({ state: 'visible' }),
    ]);

    // 2(c) Signup/Login -> signupLoginNavLink, expected URL /login, expected signal:
    // LoginPage.loginHeading visible.
    await homePage.gotoHome();
    await homePage.clickNavAndExpectUrl(homePage.signupLoginNavLink, /\/login$/);
    await expect(page).toHaveURL('/login');
    await expect(loginPage.loginHeading).toBeVisible();

    // 2(d) Test Cases -> testCasesNavLink, expected URL /test_cases, expected signal:
    // page.title() equals exactly 'Automation Practice Website for UI Testing - Test Cases'.
    await homePage.gotoHome();
    await homePage.clickNavAndExpectUrl(homePage.testCasesNavLink, /\/test_cases$/);
    await expect(page).toHaveURL('/test_cases');
    await expect(page).toHaveTitle('Automation Practice Website for UI Testing - Test Cases');

    // 2(e) API Testing -> apiTestingNavLink, expected URL /api_list, expected signal:
    // page.title() equals exactly 'Automation Practice for API Testing'.
    await homePage.gotoHome();
    await homePage.clickNavAndExpectUrl(homePage.apiTestingNavLink, /\/api_list$/);
    await expect(page).toHaveURL('/api_list');
    await expect(page).toHaveTitle('Automation Practice for API Testing');

    // 2(f) Contact us -> contactUsNavLink, expected URL /contact_us, expected signal:
    // ContactUsPage.getInTouchHeading visible.
    await homePage.gotoHome();
    await homePage.clickNavAndExpectUrl(homePage.contactUsNavLink, /\/contact_us$/);
    await expect(page).toHaveURL('/contact_us');
    await expect(contactUsPage.getInTouchHeading).toBeVisible();
  });
});
