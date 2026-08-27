// spec: specs/products.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../pages/ProductsPage';

test.describe('Product Search', () => {
  test("Searching for an existing term shows the 'Searched Products' state with matching results", async ({ page }) => {
    const productsPage = new ProductsPage(page);

    // 1. On a freshly loaded /products page, confirm the search input (#search_product) is empty,
    // then fill it with 'Top' and click the search button (#submit_search).
    await productsPage.gotoProducts();
    await expect(productsPage.searchInput).toHaveValue('');
    await productsPage.search('Top');

    await expect(page).toHaveURL(/\/products\?search=Top$/);
    await expect(productsPage.searchedProductsHeading).toBeVisible();
    await expect(productsPage.productCards).toHaveCount(14);
  });

  test("Searching for a term with no matches shows an empty 'Searched Products' grid", async ({ page }) => {
    const productsPage = new ProductsPage(page);

    // 1. On a freshly loaded /products page, fill the search input with a string guaranteed not
    // to match any product (e.g. 'zzzznonexistentproduct123') and submit the search.
    await productsPage.gotoProducts();
    await productsPage.search('zzzznonexistentproduct123');

    await expect(page).toHaveURL(/\/products\?search=zzzznonexistentproduct123$/);
    await expect(productsPage.searchedProductsHeading).toBeVisible();
    await expect(productsPage.productCards).toHaveCount(0);
  });

  test("Submitting an empty search term falls back to the full 'All Products' listing (boundary case)", async ({ page }) => {
    const productsPage = new ProductsPage(page);

    // 1. Navigate directly to /products?search= (empty search query string, reproducing
    // submitting the search form with an empty input).
    await productsPage.goto('/products?search=');

    await expect(productsPage.allProductsHeading).toBeVisible();
    await expect(productsPage.searchedProductsHeading).not.toBeVisible();
    await expect(productsPage.productCards).toHaveCount(34);
  });
});
