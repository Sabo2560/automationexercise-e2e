// spec: specs/products.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../pages/ProductsPage';

test.describe('Brand Filtering', () => {
  test("Clicking a brand link navigates to its dedicated listing showing only that brand's products", async ({ page }) => {
    const productsPage = new ProductsPage(page);

    // 1. On a freshly loaded /products page, read the 'Polo' brand link's product-count badge
    // text, then click the 'Polo' brand link.
    await productsPage.gotoProducts();
    const poloProductCount = await productsPage.getBrandProductCount('Polo');
    await productsPage.brandLink('Polo').click();

    await expect(page).toHaveURL(/\/brand_products\/Polo$/);
    await expect(page).toHaveTitle('Automation Exercise - Polo Products');
    await expect(productsPage.brandHeading).toHaveText('Brand -  Polo Products');
    await expect(productsPage.productCards).toHaveCount(poloProductCount);

    // 2. On the resulting page, confirm the Category and Brands sidebars are still present and functional.
    await expect(productsPage.categorySidebarHeading).toBeVisible();
    await expect(productsPage.brandsHeading).toBeVisible();
    await expect(productsPage.brandLink('Polo')).toBeVisible();
    await expect(productsPage.brandLink('H&M')).toBeVisible();
    await expect(productsPage.brandLink('Madame')).toBeVisible();
    await expect(productsPage.brandLink('Mast & Harbour')).toBeVisible();
    await expect(productsPage.brandLink('Babyhug')).toBeVisible();
    await expect(productsPage.brandLink('Allen Solly Junior')).toBeVisible();
    await expect(productsPage.brandLink('Kookie Kids')).toBeVisible();
    await expect(productsPage.brandLink('Biba')).toBeVisible();
  });
});
