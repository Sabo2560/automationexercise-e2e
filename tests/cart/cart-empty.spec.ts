// spec: specs/cart.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';

test.describe('Empty Cart State', () => {
  test('Fresh visit to /view_cart with no items shows the empty-cart state', async ({ page }) => {
    const cartPage = new CartPage(page);

    // 1. In a fresh browser context with no prior Add-to-Cart actions, navigate directly to
    // https://automationexercise.com/view_cart.
    await cartPage.gotoCart();

    await expect(cartPage.cartTable).toHaveCount(0);
    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(cartPage.emptyCartMessage).toHaveText('Cart is empty! Click here to buy products.');
    await expect(cartPage.emptyCartProductsLink).toHaveAttribute('href', '/products');
    await expect(cartPage.proceedToCheckoutButton).toHaveCount(0);

    // 2. Click the 'here' link inside the empty-cart message.
    await cartPage.emptyCartProductsLink.click();

    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
  });
});
