// spec: specs/navigation.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { ProductsPage } from '../../pages/ProductsPage';

test.describe('Back Navigation', () => {
  test('Browser back-navigation after following a nav link returns cleanly to the prior page', async ({ page }) => {
    const homePage = new HomePage(page);
    const productsPage = new ProductsPage(page);

    // Fail the test if any native dialog (e.g. a form-resubmission confirm) is ever presented
    // during a browser back-navigation in this test — the test should NOT need to register a
    // dialog handler for back-navigation to succeed cleanly.
    let dialogFired = false;
    page.on('dialog', (dialog) => {
      dialogFired = true;
      void dialog.dismiss();
    });

    // 1. Assume a fresh, unauthenticated context. Instantiate HomePage, navigate to '/' via
    // gotoHome(). Click productsNavLink to land on '/products'.
    await homePage.gotoHome();
    await homePage.clickNavAndExpectUrl(homePage.productsNavLink, /\/products$/);
    await expect(page).toHaveURL('/products');
    await expect(productsPage.allProductsHeading).toBeVisible();

    // 2. Invoke the browser's native back navigation (page.goBack()). This is a single-hop
    // boundary case (one back-step after one forward-step).
    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(homePage.featuresItemsHeading).toBeVisible();
    expect(dialogFired).toBe(false);

    // 3. Now test a multi-hop boundary case in the same test: from Home, click productsNavLink
    // (-> /products), then click cartNavLink (-> /view_cart), building a 2-hop forward chain.
    // Then call page.goBack() twice in succession.
    await homePage.clickNavAndExpectUrl(homePage.productsNavLink, /\/products$/);
    await homePage.clickNavAndExpectUrl(homePage.cartNavLink, /\/view_cart$/);

    await page.goBack();
    await expect(page).toHaveURL('/products');
    await expect(productsPage.allProductsHeading).toBeVisible();
    expect(dialogFired).toBe(false);

    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(homePage.featuresItemsHeading).toBeVisible();
    expect(dialogFired).toBe(false);
  });
});
