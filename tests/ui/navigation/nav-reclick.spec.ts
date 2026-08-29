// spec: specs/navigation.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { ProductsPage } from '../../pages/ProductsPage';

test.describe('Back Navigation', () => {
  test('Returning to a prior page via the nav bar itself (re-click) renders correctly', async ({ page }) => {
    const homePage = new HomePage(page);
    const productsPage = new ProductsPage(page);

    // 1. Assume a fresh, unauthenticated context. Instantiate HomePage, navigate to '/' via
    // gotoHome(). Click productsNavLink to land on '/products', confirming
    // ProductsPage.allProductsHeading is visible.
    await homePage.gotoHome();
    await homePage.clickNavAndExpectUrl(homePage.productsNavLink, /\/products$/);
    await expect(page).toHaveURL('/products');
    await expect(productsPage.allProductsHeading).toBeVisible();

    // 2. From '/products', click homeNavLink in the SAME header nav bar (not browser back) to
    // return to Home.
    await homePage.clickNavAndExpectUrl(homePage.homeNavLink, /\/$/);
    await expect(page).toHaveURL('/');
    await expect(homePage.featuresItemsHeading).toBeVisible();
  });
});
