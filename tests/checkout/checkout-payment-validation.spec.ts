// spec: specs/checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { LoginPage } from '../pages/LoginPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { SignupPage, generateTestUser } from '../pages/SignupPage';

test.describe('Checkout / Orders', () => {
  test('Payment form blocks submission until all required fields are filled (native HTML5 validation)', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    const { name, email, password } = generateTestUser('Payment Validation');

    // 1. Using a fresh disposable account (SignupPage.registerAndLogin) and 1 item added to cart
    // (ProductDetailsPage.addToCartAndViewCart(1)), reach '/payment' via CartPage.proceedToCheckoutButton
    // then CheckoutPage.clickPlaceOrder(). Read each of the 5 inputs' 'required' IDL property via
    // locator.evaluate.
    await signupPage.registerAndLogin(loginPage, name, email, password);
    await productDetailsPage.addToCartAndViewCart(1);
    await checkoutPage.proceedToCheckoutFromCart(cartPage);
    await checkoutPage.clickPlaceOrder();

    // expect: The page URL equals '/payment' and a 'Payment' heading is visible.
    await expect(page).toHaveURL(/\/payment$/);
    await expect(checkoutPage.paymentHeading).toBeVisible();

    // expect: Each of the 5 inputs' '.required' DOM property equals true, establishing that native
    // browser validation applies to every field before any submission is attempted.
    const paymentInputs = [
      checkoutPage.nameOnCardInput,
      checkoutPage.cardNumberInput,
      checkoutPage.cvcInput,
      checkoutPage.expiryMonthInput,
      checkoutPage.expiryYearInput,
    ];
    for (const input of paymentInputs) {
      expect(await input.evaluate((el: HTMLInputElement) => el.required)).toBe(true);
    }

    // 2. With every payment field left empty, begin listening for any 'POST' request to '/payment',
    // then click 'Pay and Confirm Order' ('[data-qa="pay-button"]').
    let paymentPostFired = false;
    const trackPaymentPost = (request: import('@playwright/test').Request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/payment') {
        paymentPostFired = true;
      }
    };
    page.on('request', trackPaymentPost);
    await checkoutPage.submitPayment();

    // expect: No 'POST /payment' network request is observed -- native browser validation blocks the
    // form submission client-side before any network call is made.
    // expect: The page URL remains exactly '/payment' (no navigation occurred).
    await expect(page).toHaveURL(/\/payment$/);
    expect(paymentPostFired).toBe(false);
    // expect: The 'Name on Card' input's ValidityState reports 'valueMissing' equal to true, confirming
    // the browser flagged it as the first invalid required field blocking submission.
    expect(await checkoutPage.nameOnCardInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(
      true,
    );

    // 3. Fill only 'Name on Card' ('Test User') and 'Card Number' ('4242424242424242'), leaving CVC,
    // Expiration Month, and Expiration Year empty, then click 'Pay and Confirm Order' again.
    await checkoutPage.nameOnCardInput.fill('Test User');
    await checkoutPage.cardNumberInput.fill('4242424242424242');
    await checkoutPage.submitPayment();

    // expect: Still no 'POST /payment' network request is observed.
    // expect: The page URL still remains exactly '/payment'.
    await expect(page).toHaveURL(/\/payment$/);
    expect(paymentPostFired).toBe(false);
    // expect: The 'CVC' input's ValidityState reports 'valueMissing' equal to true (the next empty
    // required field in DOM order), confirming partial completion still does not satisfy native
    // validation.
    expect(await checkoutPage.cvcInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    page.off('request', trackPaymentPost);

    // 4. Delete this scenario's disposable account via the header 'Delete Account' link. (The cart
    // still holds its unpurchased item at this point, and no order was ever placed under this account.)
    await loginPage.deleteAccountNavLink.click();

    // expect: The standard 'Account Deleted!' heading and confirmation text are shown, confirming
    // cleanup succeeds even though this account still had a non-empty, unpurchased cart at the time of
    // deletion.
    await expect(signupPage.accountDeletedHeading).toBeVisible();
    await expect(page.getByText('Your account has been permanently deleted!')).toBeVisible();
  });
});
