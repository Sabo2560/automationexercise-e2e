// spec: specs/cart.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CartPage } from '../../pages/CartPage';
import { ProductDetailsPage } from '../../pages/ProductDetailsPage';

test.describe('Login-Gated Checkout', () => {
  test("Clicking 'Proceed to Checkout' while not logged in shows the login/register modal instead of navigating to checkout", async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);

    // 1. In a fresh, logged-out browser context, add product 1 to the cart via
    // ProductDetailsPage and navigate to /view_cart. Confirm no network requests to any
    // checkout/payment endpoint have occurred yet, then click the 'Proceed To Checkout'
    // control ('a.check_out').
    await productDetailsPage.addToCartAndViewCart(1);

    await expect(page).toHaveURL(/\/view_cart$/);
    await expect(cartPage.cartRows).toHaveCount(1);

    const checkoutOrPaymentRequests: string[] = [];
    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      if (path.includes('/payment') || path.includes('/checkout')) {
        checkoutOrPaymentRequests.push(path);
      }
    });

    await cartPage.clickProceedToCheckout();

    // expect: The page URL remains exactly '/view_cart' after the click (no navigation to
    // '/login' or any checkout/payment route occurred).
    await expect(page).toHaveURL(/\/view_cart$/);

    // expect: '#checkoutModal' becomes visible.
    await expect(cartPage.checkoutModal).toBeVisible();

    // expect: Inside the modal, a heading with the exact text 'Checkout' and a paragraph with
    // the exact text 'Register / Login account to proceed on checkout.' are visible.
    await expect(cartPage.checkoutModalHeading).toBeVisible();
    await expect(cartPage.checkoutModalHeading).toHaveText('Checkout');
    await expect(cartPage.checkoutModalMessage).toBeVisible();
    await expect(cartPage.checkoutModalMessage).toHaveText('Register / Login account to proceed on checkout.');

    // expect: Inside the modal, a link with the exact text 'Register / Login' has href equal
    // to '/login' (the same destination used by LoginPage.gotoLogin(), confirmed without
    // exercising the login form itself).
    await expect(cartPage.checkoutModalLoginLink).toHaveText('Register / Login');
    await expect(cartPage.checkoutModalLoginLink).toHaveAttribute('href', '/login');

    // expect: No network request to a checkout or payment endpoint (e.g. matching '/payment'
    // or '/checkout') is observed as a result of this click, confirming the gate is purely a
    // client-side modal, not a redirected/aborted server-side checkout attempt.
    expect(checkoutOrPaymentRequests).toHaveLength(0);

    // 2. With the modal open, click the 'Continue On Cart' button ('button.close-checkout-modal').
    await cartPage.dismissCheckoutModal();

    // expect: '#checkoutModal' becomes hidden again.
    await expect(cartPage.checkoutModal).toBeHidden();

    // expect: The page URL remains exactly '/view_cart' -- dismissing the modal does not
    // navigate anywhere.
    await expect(page).toHaveURL(/\/view_cart$/);

    // expect: The cart's line item (product 1, 'Blue Top') is still present and unchanged in
    // '#cart_info_table' (row 'product-1' still shows its original price/quantity/total),
    // confirming dismissing the modal does not clear or alter the cart.
    await expect(cartPage.row(1)).toBeVisible();
    await expect(cartPage.rowUnitPrice(1)).toHaveText('Rs. 500');
    await expect(cartPage.rowQuantityControl(1)).toHaveText('1');
    await expect(cartPage.rowLineTotal(1)).toHaveText('Rs. 500');
  });
});
