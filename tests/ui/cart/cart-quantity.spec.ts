// spec: specs/cart.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CartPage } from '../../pages/CartPage';
import { ProductDetailsPage } from '../../pages/ProductDetailsPage';

test.describe('Cart Quantity Control', () => {
  test('Cart quantity is a static, non-editable display control', async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);

    // 1. Add product 1 to the cart with quantity 2 (via ProductDetailsPage, as in the display
    // scenarios above) and navigate to /view_cart. Confirm the row's quantity control is a
    // '<button>' element (not an '<input>') by reading its tagName, and confirm it does not
    // carry the HTML 'disabled' attribute.
    await productDetailsPage.addToCartAndViewCart(1, 2);

    const quantityControl = cartPage.rowQuantityControl(1);
    const { tagName, hasDisabled } = await quantityControl.evaluate((el) => ({
      tagName: el.tagName,
      hasDisabled: el.hasAttribute('disabled'),
    }));
    expect(tagName).toBe('BUTTON');
    expect(hasDisabled).toBe(false);

    // 2. Click the quantity control once.
    await quantityControl.click();

    await expect(quantityControl).toHaveText('2');
  });
});
