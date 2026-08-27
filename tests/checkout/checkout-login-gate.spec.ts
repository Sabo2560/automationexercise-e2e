// spec: specs/checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { LoginPage } from '../pages/LoginPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { SignupPage, generateTestUser } from '../pages/SignupPage';

test.describe('Checkout / Orders', () => {
  test('Login-gate modal leads into register-while-checkout, then successfully resumes to the address page (Test Case 14 / 23)', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    const { name, email, password } = generateTestUser('Register While Checkout');
    // Address data deliberately distinct from scenario 1.1's account (United
    // States/San Francisco), to prove the address block on '/checkout' is dynamically
    // sourced from whichever account is currently logged in.
    const accountInfo = {
      firstName: 'Register',
      lastName: 'Checkout',
      address: '456 Register Ave',
      country: 'Canada',
      state: 'Ontario',
      city: 'Toronto',
      zipcode: 'M5H2N2',
      mobileNumber: '4165551234',
    };
    const expectedAddress = [
      `Mr. ${accountInfo.firstName} ${accountInfo.lastName}`,
      accountInfo.address,
      `${accountInfo.city} ${accountInfo.state} ${accountInfo.zipcode}`,
      accountInfo.country,
      accountInfo.mobileNumber,
    ].join('\n');

    // 1. In a fresh, logged-out browser context, add product 1 to the cart via
    // ProductDetailsPage.addToCartAndViewCart(1) and land on /view_cart. Click 'Proceed To
    // Checkout' (CartPage.clickProceedToCheckout()).
    await productDetailsPage.addToCartAndViewCart(1);
    await cartPage.clickProceedToCheckout();

    // expect: '#checkoutModal' becomes visible.
    await expect(cartPage.checkoutModal).toBeVisible();

    // 2. Click the modal's 'Register / Login' link (cartPage.checkoutModalLoginLink).
    await cartPage.checkoutModalLoginLink.click();

    // expect: The resulting page URL equals exactly '/login' (a real navigation away from
    // /view_cart).
    await expect(page).toHaveURL(/\/login$/);
    // expect: A 'New User Signup!' heading is visible on the destination page.
    await expect(loginPage.signupHeading).toBeVisible();

    // 3. Generate a second disposable test user (SignupPage.generateTestUser()) using address
    // data deliberately distinct from any other scenario in this plan. Fill the New User
    // Signup mini-form (LoginPage.startSignup(name, email)), then the full Account
    // Information form (SignupPage.fillAccountInformation(...) + submit()), then click
    // 'Continue'.
    await loginPage.startSignup(name, email);
    await signupPage.fillAccountInformation({ password, ...accountInfo });
    await signupPage.submit();
    await signupPage.continueButton.click();

    // expect: The resulting page URL equals '/', and the header shows text containing
    // 'Logged in as {name}' for this second disposable account.
    await expect(page).toHaveURL('/');
    await expect(loginPage.loggedInAsText).toContainText(`Logged in as ${name}`);

    // 4. Navigate to '/view_cart'.
    await cartPage.gotoCart();

    // expect: '#cart_info_table' still shows exactly 1 row for product 1 ('Blue Top', unit
    // price 'Rs. 500', quantity '1', line total 'Rs. 500') -- the exact same line item added
    // anonymously in the first step, confirming the cart survives the entire
    // register-while-checkout detour without being cleared.
    await expect(cartPage.cartRows).toHaveCount(1);
    await expect(cartPage.rowUnitPrice(1)).toHaveText('Rs. 500');
    await expect(cartPage.rowQuantityControl(1)).toHaveText('1');
    await expect(cartPage.rowLineTotal(1)).toHaveText('Rs. 500');

    // 5. Click 'Proceed To Checkout' again.
    await cartPage.proceedToCheckoutButton.click();

    // expect: This time the resulting page URL equals exactly '/checkout' -- '#checkoutModal'
    // does NOT appear (the user is now logged in), confirming the checkout flow successfully
    // resumes past the login gate after registration.
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(cartPage.checkoutModal).toBeHidden();
    // expect: '#address_delivery' and '#address_invoice' are both visible and each shows this
    // second account's own just-registered data -- verified equal to exactly the values
    // passed into fillAccountInformation above (read from the same in-test variables, never
    // hardcoded), and explicitly NOT equal to any other scenario's account data (e.g. not
    // 'United States'/'San Francisco'), proving the address block is dynamically sourced
    // from whichever account is currently logged in.
    await expect(checkoutPage.deliveryAddress).toBeVisible();
    await expect(checkoutPage.billingAddress).toBeVisible();
    const deliveryText = await checkoutPage.getAddressText(checkoutPage.deliveryAddress);
    const billingText = await checkoutPage.getAddressText(checkoutPage.billingAddress);
    expect(deliveryText).toBe(expectedAddress);
    expect(billingText).toBe(expectedAddress);
    expect(deliveryText).not.toContain('United States');
    expect(deliveryText).not.toContain('San Francisco');

    // 6. Click the header 'Delete Account' link to remove this scenario's disposable
    // account. (No order is placed in this scenario -- it deliberately stops at the
    // address/review step.)
    await loginPage.deleteAccountNavLink.click();

    // expect: The standard 'Account Deleted!' heading and 'Your account has been permanently
    // deleted!' text are shown, matching the cleanup pattern used in every other chunk that
    // creates a disposable account.
    await expect(signupPage.accountDeletedHeading).toBeVisible();
    await expect(page.getByText('Your account has been permanently deleted!')).toBeVisible();
  });
});
