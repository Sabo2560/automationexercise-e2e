// spec: specs/products.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../pages/ProductsPage';

test.describe('Products Listing', () => {
  test('Category sidebar accordion expands the clicked panel and collapses any previously open one', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    // 1. On a freshly loaded /products page, confirm no category panel is expanded by default
    // (no subcategory links visible under Women, Men, or Kids), then click the 'Women' category link.
    await productsPage.gotoProducts();

    const womenDressLink = productsPage.categorySubcategoryLink(1);
    const womenTopsLink = productsPage.categorySubcategoryLink(2);
    const womenSareeLink = productsPage.categorySubcategoryLink(7);
    const menTshirtsLink = productsPage.categorySubcategoryLink(3);
    const kidsDressLink = productsPage.categorySubcategoryLink(4);

    await expect(womenDressLink).toBeHidden();
    await expect(womenTopsLink).toBeHidden();
    await expect(womenSareeLink).toBeHidden();
    await expect(menTshirtsLink).toBeHidden();
    await expect(kidsDressLink).toBeHidden();

    await productsPage.expandCategory('Women');

    // Subcategory links appear under Women, including at minimum Dress, Tops, and Saree.
    await expect(womenDressLink).toBeVisible();
    await expect(womenDressLink).toHaveAttribute('href', '/category_products/1');
    await expect(womenTopsLink).toBeVisible();
    await expect(womenTopsLink).toHaveAttribute('href', '/category_products/2');
    await expect(womenSareeLink).toBeVisible();
    await expect(womenSareeLink).toHaveAttribute('href', '/category_products/7');

    // The Women panel link's class no longer includes 'collapsed' (i.e. it is expanded).
    await expect(productsPage.categoryWomenLink).not.toHaveClass(/collapsed/);
    await expect(page).toHaveURL(/\/products$/);

    // 2. Without navigating away, click the 'Men' category link.
    await productsPage.expandCategory('Men');

    // The Women panel link's class now includes 'collapsed' again and its subcategory links are no longer visible.
    await expect(productsPage.categoryWomenLink).toHaveClass(/collapsed/);
    await expect(womenDressLink).toBeHidden();
    await expect(womenTopsLink).toBeHidden();
    await expect(womenSareeLink).toBeHidden();

    // The Men panel link's class no longer includes 'collapsed' and at least one subcategory link is visible under it.
    await expect(productsPage.categoryMenLink).not.toHaveClass(/collapsed/);
    await expect(menTshirtsLink).toBeVisible();

    // The page URL is still '/products' throughout (the accordion toggle causes no navigation).
    await expect(page).toHaveURL(/\/products$/);
  });
});
