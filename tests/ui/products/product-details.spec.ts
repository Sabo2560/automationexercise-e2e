// spec: specs/products.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ProductDetailsPage } from '../../pages/ProductDetailsPage';

test.describe('Product Details & Add to Cart', () => {
  test('Product details page renders all expected product information', async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);

    // 1. Navigate directly to https://automationexercise.com/product_details/1 (fresh/blank browser state).
    await productDetailsPage.gotoProduct(1);

    await expect(productDetailsPage.productNameHeading).toHaveText('Blue Top');
    await expect(productDetailsPage.categoryText).toHaveText('Category: Women > Tops');
    await expect(productDetailsPage.priceText).toHaveText('Rs. 500');
    await expect(productDetailsPage.quantityInput).toHaveValue('1');
    await expect(productDetailsPage.quantityInput).toHaveAttribute('type', 'number');
    await expect(productDetailsPage.quantityInput).toHaveAttribute('min', '1');
    await expect(productDetailsPage.availabilityText).toHaveText('Availability: In Stock');
    await expect(productDetailsPage.conditionText).toHaveText('Condition: New');
    await expect(productDetailsPage.brandText).toHaveText('Brand: Polo');

    // '#cartModal' is present in the DOM but not visible prior to any Add to Cart click.
    await expect(productDetailsPage.cartModal).toBeAttached();
    await expect(productDetailsPage.cartModal).toBeHidden();
  });

  test('Adding a product to the cart with a custom quantity opens the confirmation modal without navigating away', async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);
    await productDetailsPage.gotoProduct(1);

    // 1. On a freshly loaded /product_details/1 page, clear the quantity input and fill it with
    // '4', then click the 'Add to cart' button.
    await productDetailsPage.setQuantity(4);
    const addToCartResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/add_to_cart/1') && response.url().includes('quantity=4'),
    );
    await productDetailsPage.addToCart();

    const addToCartResponse = await addToCartResponsePromise;
    expect(addToCartResponse.status()).toBe(200);
    expect(new URL(addToCartResponse.url()).pathname).toBe('/add_to_cart/1');
    expect(new URL(addToCartResponse.url()).searchParams.get('quantity')).toBe('4');

    await expect(page).toHaveURL(/\/product_details\/1$/);
    await expect(productDetailsPage.cartModal).toBeVisible();
    await expect(productDetailsPage.cartModalAddedHeading).toBeVisible();
    await expect(productDetailsPage.cartModalMessage).toBeVisible();
    await expect(productDetailsPage.viewCartModalLink).toHaveAttribute('href', '/view_cart');
    await expect(productDetailsPage.continueShoppingButton).toBeVisible();

    // 2. Click the 'Continue Shopping' button inside the modal.
    await productDetailsPage.continueShoppingButton.click();

    await expect(productDetailsPage.cartModal).toBeHidden();
    await expect(page).toHaveURL(/\/product_details\/1$/);
    await expect(productDetailsPage.quantityInput).toHaveValue('4');
  });

  test('Quantity input rejects values below its minimum (boundary case)', async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);

    // 1. On a freshly loaded /product_details/1 page, use the quantity input's native
    // attributes to attempt setting a value of '0' (below the confirmed min='1').
    await productDetailsPage.gotoProduct(1);
    await productDetailsPage.setQuantity(0);

    const validity = await productDetailsPage.quantityInput.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      rangeUnderflow: el.validity.rangeUnderflow,
    }));
    expect(validity.valid).toBe(false);
    expect(validity.rangeUnderflow).toBe(true);
  });
});
