// spec: specs/products.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../pages/ProductsPage';
import { ProductDetailsPage } from '../../pages/ProductDetailsPage';
import { CartPage } from '../../pages/CartPage';

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

  test("Viewing a brand-filtered product's details and adding it to cart reflects correctly in the cart (closes TC19 'View & Cart Brand Products' audit gap)", async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);

    // 1. Navigate to https://automationexercise.com/brand_products/Polo (ProductsPage.gotoBrand('Polo')).
    await productsPage.gotoBrand('Polo');

    await expect(page).toHaveURL(/\/brand_products\/Polo$/);
    await expect(productsPage.brandHeading).toHaveText('Brand -  Polo Products');
    await expect(productsPage.productCards).toHaveCount(6);

    // Among the 6 cards, confirm product id 8's card (scoped via its "View Product" href, not
    // the whole grid) shows the expected price and name.
    const product8Card = productsPage.productCards.filter({
      has: page.locator('a[href="/product_details/8"]'),
    });
    await expect(product8Card.locator('.choose').getByText('View Product')).toHaveAttribute(
      'href',
      '/product_details/8',
    );
    await expect(product8Card.locator('.productinfo h2')).toHaveText('Rs. 700');
    await expect(product8Card.locator('.productinfo p')).toHaveText('Fancy Green Top');

    // 2. Click the 'View Product' link for product id 8 (ProductsPage.productViewProductLink(8))
    // to navigate to its detail page.
    await productsPage.productViewProductLink(8).click();

    await expect(page).toHaveURL(/\/product_details\/8$/);
    await expect(productDetailsPage.productNameHeading).toHaveText('Fancy Green Top');
    await expect(productDetailsPage.categoryText).toHaveText('Category: Women > Tops');
    await expect(productDetailsPage.priceText).toHaveText('Rs. 700');
    await expect(productDetailsPage.brandText).toHaveText('Brand: Polo');

    // 3. Set the quantity input (#quantity) to '3' (ProductDetailsPage.setQuantity(3)), then
    // click 'Add to cart' (ProductDetailsPage.addToCart()).
    await productDetailsPage.setQuantity(3);
    const addToCartResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/add_to_cart/8') && response.url().includes('quantity=3'),
    );
    await productDetailsPage.addToCart();

    const addToCartResponse = await addToCartResponsePromise;
    expect(addToCartResponse.status()).toBe(200);
    expect(new URL(addToCartResponse.url()).pathname).toBe('/add_to_cart/8');
    expect(new URL(addToCartResponse.url()).searchParams.get('quantity')).toBe('3');

    await expect(productDetailsPage.cartModal).toBeVisible();
    await expect(productDetailsPage.cartModalAddedHeading).toBeVisible();
    await expect(productDetailsPage.cartModalMessage).toBeVisible();

    // 4. Click the modal's 'View Cart' link (ProductDetailsPage.viewCartModalLink) to navigate to the cart.
    await productDetailsPage.viewCartModalLink.click();

    await expect(page).toHaveURL(/\/view_cart$/);
    await expect(cartPage.cartTable).toBeVisible();

    // 5. On the resulting cart page, locate the row for product id 8 (CartPage.row(8)) and
    // verify each of its cells.
    await expect(cartPage.rowNameLink(8)).toHaveText('Fancy Green Top');
    await expect(cartPage.rowNameLink(8)).toHaveAttribute('href', '/product_details/8');
    await expect(cartPage.rowCategory(8)).toHaveText('Women > Tops');
    await expect(cartPage.rowUnitPrice(8)).toHaveText('Rs. 700');
    await expect(cartPage.rowQuantityControl(8)).toHaveText('3');
    await expect(cartPage.rowLineTotal(8)).toHaveText('Rs. 2100');

    // Clean up the item added to the cart during this live verification.
    await cartPage.deleteItem(8);
  });
});
