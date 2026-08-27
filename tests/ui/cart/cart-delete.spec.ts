// spec: specs/cart.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CartPage } from '../../pages/CartPage';
import { ProductDetailsPage } from '../../pages/ProductDetailsPage';

test.describe('Item Removal', () => {
  test('Deleting one of two items removes only that row and leaves the other item and its data intact', async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);

    // 1. Add product 1 (quantity 2) and product 2 (default quantity) to the cart via
    // ProductDetailsPage and navigate to /view_cart, confirming '#cart_info_table' shows
    // exactly 2 rows ('product-1' and 'product-2'). Then click the delete control
    // ('.cart_delete a.cart_quantity_delete') inside the 'product-2' row.
    await productDetailsPage.addToCartAndViewCart(1, 2);
    await productDetailsPage.addToCartAndViewCart(2);

    await expect(cartPage.cartRows).toHaveCount(2);

    const deleteProduct2ResponsePromise = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/delete_cart/2',
    );
    await cartPage.deleteItem(2);

    const deleteProduct2Response = await deleteProduct2ResponsePromise;
    expect(deleteProduct2Response.status()).toBe(200);

    await expect(page).toHaveURL(/\/view_cart$/);
    await expect(cartPage.row(2)).toHaveCount(0);
    await expect(cartPage.cartRows).toHaveCount(1);
    await expect(cartPage.rowUnitPrice(1)).toHaveText('Rs. 500');
    await expect(cartPage.rowQuantityControl(1)).toHaveText('2');
    await expect(cartPage.rowLineTotal(1)).toHaveText('Rs. 1000');
  });

  test('Deleting the last remaining item returns the cart to the empty-cart state', async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);

    // 1. Starting from a cart containing exactly one item (product 1, added via
    // ProductDetailsPage as in prior scenarios) on /view_cart, click that row's delete
    // control ('.cart_delete a.cart_quantity_delete' inside '#product-1').
    await productDetailsPage.addToCartAndViewCart(1);

    await expect(cartPage.cartRows).toHaveCount(1);

    const deleteProduct1ResponsePromise = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/delete_cart/1',
    );
    await cartPage.deleteItem(1);

    const deleteProduct1Response = await deleteProduct1ResponsePromise;
    expect(deleteProduct1Response.status()).toBe(200);

    await expect(page).toHaveURL(/\/view_cart$/);
    // NOTE: unlike a fresh page load (see cart-empty.spec.ts), deleting the last item via the
    // in-page AJAX call does not remove '#cart_info_table' from the DOM — the site's JS just
    // toggles it to 'display: none' (confirmed live: outerHTML retained, computed display:
    // none, 0 body rows) while revealing '#empty_cart'. So the count assertion below would
    // always see count 1; assert hidden-ness instead, which is what "returns to the empty-cart
    // state" actually means here.
    await expect(cartPage.cartTable).toBeHidden();
    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(cartPage.emptyCartMessage).toHaveText('Cart is empty! Click here to buy products.');
    // Same DOM-retention behavior as '#cart_info_table' above: the "Proceed To Checkout"
    // button lives in the cart-table container that gets hidden (not removed) after the
    // AJAX delete, so assert hidden-ness rather than DOM removal.
    await expect(cartPage.proceedToCheckoutButton).toBeHidden();
  });
});
