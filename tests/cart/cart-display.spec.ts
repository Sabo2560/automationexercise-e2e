// spec: specs/cart.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';

test.describe('Cart Line-Item Display', () => {
  test('Adding a single item via Add to Cart displays its name, category, price, quantity, and correct line total in the cart', async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);

    // 1. Using ProductDetailsPage, navigate to /product_details/1 ('Blue Top', unit price
    // confirmed 'Rs. 500'), set quantity to 2, click Add to Cart, wait for '#cartModal' to
    // appear, then click its 'View Cart' link to navigate to /view_cart.
    await productDetailsPage.addToCartAndViewCart(1, 2);

    await expect(page).toHaveURL(/\/view_cart$/);
    await expect(cartPage.cartTable).toBeVisible();
    await expect(cartPage.cartRows).toHaveCount(1);

    await expect(cartPage.rowNameLink(1)).toHaveText('Blue Top');
    await expect(cartPage.rowNameLink(1)).toHaveAttribute('href', '/product_details/1');
    await expect(cartPage.rowCategory(1)).toHaveText('Women > Tops');
    await expect(cartPage.rowUnitPrice(1)).toHaveText('Rs. 500');
    await expect(cartPage.rowQuantityControl(1)).toHaveText('2');
    await expect(cartPage.rowLineTotal(1)).toHaveText('Rs. 1000');
  });

  test('Adding a second distinct product shows both rows independently with correct per-row data and no combined cart-wide total', async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);

    // 1. Starting from a cart already containing product 1 ('Blue Top', quantity 2, unit price
    // Rs. 500 -- added the same way as the previous scenario), use ProductDetailsPage to
    // navigate to /product_details/2 ('Men Tshirt'), leave quantity at its default, click Add
    // to Cart, then use its cart modal's 'View Cart' link to return to /view_cart.
    await productDetailsPage.addToCartAndViewCart(1, 2);
    await productDetailsPage.addToCartAndViewCart(2);

    await expect(cartPage.cartRows).toHaveCount(2);

    await expect(cartPage.rowUnitPrice(1)).toHaveText('Rs. 500');
    await expect(cartPage.rowQuantityControl(1)).toHaveText('2');
    await expect(cartPage.rowLineTotal(1)).toHaveText('Rs. 1000');

    await expect(cartPage.rowNameLink(2)).toHaveText('Men Tshirt');
    await expect(cartPage.rowNameLink(2)).toHaveAttribute('href', '/product_details/2');
    await expect(cartPage.rowCategory(2)).toHaveText('Men > Tshirts');
    await expect(cartPage.rowUnitPrice(2)).toHaveText('Rs. 400');
    await expect(cartPage.rowQuantityControl(2)).toHaveText('1');
    await expect(cartPage.rowLineTotal(2)).toHaveText('Rs. 400');

    // 2. Search the full '/view_cart' page DOM for any element displaying a combined/grand
    // total figure (e.g. the sum 'Rs. 1400') outside of the two individual
    // '.cart_total_price' cells already asserted above.
    await expect(page.getByText('1400')).toHaveCount(0);
  });
});
