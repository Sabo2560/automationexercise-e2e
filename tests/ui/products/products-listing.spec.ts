// spec: specs/products.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../pages/ProductsPage';

test.describe('Products Listing', () => {
  test("Default /products load shows the full 'All Products' grid with well-formed cards", async ({ page }) => {
    const productsPage = new ProductsPage(page);

    // 1. Navigate to https://automationexercise.com/products (fresh/blank browser state). Do not search or filter.
    await productsPage.gotoProducts();
    await expect(page).toHaveTitle('Automation Exercise - All Products');
    await expect(productsPage.allProductsHeading).toBeVisible();
    await expect(productsPage.productCards).toHaveCount(34);

    // First card (product id 1, 'Blue Top') shows price, name, Add to cart control, and View Product link.
    await expect(productsPage.firstProductPrice).toHaveText('Rs. 500');
    await expect(productsPage.firstProductName).toHaveText('Blue Top');
    await expect(productsPage.firstProductAddToCart).toBeVisible();
    await expect(productsPage.firstProductViewProduct).toHaveAttribute('href', '/product_details/1');

    // 2. Click the 'View Product' link on the first product card ('Blue Top').
    await productsPage.firstProductViewProduct.click();
    await expect(page).toHaveURL(/\/product_details\/1$/);
    await expect(page.locator('.product-information h2')).toHaveText('Blue Top');
  });
});
