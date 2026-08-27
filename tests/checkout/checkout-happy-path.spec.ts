// spec: specs/checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { LoginPage } from '../pages/LoginPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { SignupPage, generateTestUser } from '../pages/SignupPage';

test.describe('Checkout / Orders', () => {
  test('Full checkout happy path: existing logged-in session through order placement and invoice download', async ({
    page,
  }) => {
    // This test runs the entire signup -> cart -> checkout -> payment -> invoice-download flow in a
    // single test, so the default 30s test timeout can be tight in a slower CI environment (confirmed
    // on GitHub Actions/Ubuntu headless WebKit, where the 'Download Invoice' step's native download
    // event took longer to fire than the remaining per-test budget). Raised here, per-test, rather
    // than in playwright.config.ts's global timeout, since only this flow is long enough to need it.
    test.setTimeout(60_000);

    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    const { name, email, password } = generateTestUser('Checkout Happy Path');
    // First/last name left at SignupPage.fillAccountInformation's own defaults ('Test'/'User'),
    // matching the plan's step 1 default account-information values.
    const firstName = 'Test';
    const lastName = 'User';
    const expectedAddress = [
      `Mr. ${firstName} ${lastName}`,
      '123 Test Street',
      'San Francisco California 94107',
      'United States',
      '1234567890',
    ].join('\n');

    // 1. Generate a disposable test user via SignupPage.generateTestUser() and register+log in via
    // SignupPage.registerAndLogin(loginPage, name, email, password) (default account-information
    // values: title 'Mr.', DOB 10 May 1990, first/last name 'Test'/'User', address '123 Test Street',
    // country 'United States', state 'California', city 'San Francisco', zipcode '94107', mobile
    // '1234567890'). Then add product 1 ('Blue Top', confirmed unit price 'Rs. 500') to the cart via
    // ProductDetailsPage.addToCartAndViewCart(1) and land on /view_cart.
    await signupPage.registerAndLogin(loginPage, name, email, password);
    await productDetailsPage.addToCartAndViewCart(1);

    // expect: The header shows text containing 'Logged in as {name}' for this disposable account.
    await expect(page).toHaveURL(/\/view_cart$/);
    await expect(loginPage.loggedInAsText).toContainText(`Logged in as ${name}`);
    // expect: '#cart_info_table' contains exactly 1 row for product 1 showing unit price 'Rs. 500',
    // quantity '1', and line total 'Rs. 500'.
    await expect(cartPage.cartRows).toHaveCount(1);
    await expect(cartPage.rowUnitPrice(1)).toHaveText('Rs. 500');
    await expect(cartPage.rowQuantityControl(1)).toHaveText('1');
    await expect(cartPage.rowLineTotal(1)).toHaveText('Rs. 500');

    // 2. Click 'Proceed To Checkout' (a.check_out) from /view_cart.
    await checkoutPage.proceedToCheckoutFromCart(cartPage);

    // expect: The resulting page URL equals exactly '/checkout' (a real server-rendered navigation) --
    // '#checkoutModal' does not appear at all, since the user is already logged in.
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(cartPage.checkoutModal).toBeHidden();
    // expect: An 'Address Details' heading (h2) is visible.
    await expect(checkoutPage.addressDetailsHeading).toBeVisible();
    // expect: Both '#address_delivery' and '#address_invoice' are visible and each shows, in order,
    // this account's own registration data.
    await expect(checkoutPage.deliveryAddress).toBeVisible();
    await expect(checkoutPage.billingAddress).toBeVisible();
    expect(await checkoutPage.getAddressText(checkoutPage.deliveryAddress)).toBe(expectedAddress);
    expect(await checkoutPage.getAddressText(checkoutPage.billingAddress)).toBe(expectedAddress);

    // expect: A 'Review Your Order' heading (h2) is visible, and the order review table contains
    // exactly 1 product row for 'Blue Top' showing unit price 'Rs. 500', quantity '1', and line total
    // 'Rs. 500', followed by a 'Total Amount' row showing 'Rs. 500' -- equal to the single line total
    // since there is only one item in the cart.
    await expect(checkoutPage.reviewOrderHeading).toBeVisible();
    const reviewRows = checkoutPage.orderReviewTable.locator('tbody tr');
    await expect(reviewRows).toHaveCount(2); // 1 product row + 1 Total Amount row
    await expect(checkoutPage.orderReviewTable.locator('.cart_description h4 a')).toHaveText('Blue Top');
    await expect(checkoutPage.orderReviewTable.locator('.cart_price p')).toHaveText('Rs. 500');
    await expect(checkoutPage.orderReviewTable.locator('.cart_quantity button')).toHaveText('1');
    const lineTotal = checkoutPage.orderReviewTable.locator('.cart_total p.cart_total_price');
    await expect(lineTotal).toHaveText('Rs. 500');
    const orderTotalText = await lineTotal.innerText();
    // Total Amount is derived from (and expected to equal) the single line total above, rather than
    // a hardcoded value, since there is only one item in the cart.
    await expect(checkoutPage.totalAmountValue).toHaveText(orderTotalText);

    // 3. Type a short comment (e.g. 'Please deliver in the morning.') into the comment textarea
    // ('textarea[name="message"]'), then click 'Place Order' ('a.check_out[href="/payment"]').
    await checkoutPage.fillComment('Please deliver in the morning.');
    await checkoutPage.clickPlaceOrder();

    // expect: The resulting page URL equals exactly '/payment'.
    await expect(page).toHaveURL(/\/payment$/);
    // expect: A 'Payment' heading (h2) is visible, and all 5 payment fields plus the 'Pay and Confirm
    // Order' button are visible via their data-qa locators.
    await expect(checkoutPage.paymentHeading).toBeVisible();
    await expect(checkoutPage.nameOnCardInput).toBeVisible();
    await expect(checkoutPage.cardNumberInput).toBeVisible();
    await expect(checkoutPage.cvcInput).toBeVisible();
    await expect(checkoutPage.expiryMonthInput).toBeVisible();
    await expect(checkoutPage.expiryYearInput).toBeVisible();
    await expect(checkoutPage.payButton).toBeVisible();

    // 4. Fill the payment form with only obviously-fake test data -- Name on Card: 'Test User', Card
    // Number: '4242424242424242', CVC: '123', Expiration Month: '12', Expiration Year: '2030' -- then
    // click 'Pay and Confirm Order'.
    await checkoutPage.fillPaymentDetails({
      nameOnCard: 'Test User',
      cardNumber: '4242424242424242',
      cvc: '123',
      expiryMonth: '12',
      expiryYear: '2030',
    });
    const paymentResponsePromise = page.waitForResponse(
      (response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/payment',
    );
    await checkoutPage.submitPayment();
    const paymentResponse = await paymentResponsePromise;

    // expect: A network request 'POST /payment' is observed returning an HTTP 302 response.
    expect(paymentResponse.status()).toBe(302);
    // expect: The resulting page URL matches the pattern '/payment_done/{n}' -- capture this id for
    // use in the next step, never hardcode it.
    await expect(page).toHaveURL(/\/payment_done\/\d+$/);
    const orderId = checkoutPage.getOrderIdFromUrl();
    expect(orderId).toBeGreaterThan(0);
    // expect: A heading with the exact text 'Order Placed!' is visible.
    await expect(checkoutPage.orderPlacedHeading).toHaveText('Order Placed!');
    // expect: A paragraph with the exact text 'Congratulations! Your order has been confirmed!' is
    // visible.
    await expect(checkoutPage.orderConfirmationMessage).toBeVisible();

    // 5. Click 'Download Invoice'.
    const totalAmountNumber = orderTotalText.replace(/[^\d]/g, '');
    const expectedInvoiceText = `Hi ${firstName} ${lastName}, Your total purchase amount is ${totalAmountNumber}. Thank you`;

    const [downloadResponse, download] = await Promise.all([
      page.waitForResponse((response) => new URL(response.url()).pathname === `/download_invoice/${orderId}`),
      checkoutPage.downloadInvoice(),
    ]);

    // expect: A real file download is triggered (a Playwright 'download' event fires) -- served by
    // 'GET /download_invoice/{n}' returning HTTP 200 with a 'content-disposition' header containing
    // 'attachment; filename=invoice.txt'.
    expect(downloadResponse.status()).toBe(200);
    expect(downloadResponse.headers()['content-disposition']).toContain('attachment; filename=invoice.txt');
    // expect: The downloaded file's full text content equals exactly
    // 'Hi Test User, Your total purchase amount is 500. Thank you'.
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    expect(readFileSync(downloadPath as string, 'utf-8').trim()).toBe(expectedInvoiceText);
    // expect: The page URL remains unchanged at '/payment_done/{n}' after the click -- no navigation
    // occurs from downloading the invoice.
    await expect(page).toHaveURL(new RegExp(`/payment_done/${orderId}$`));

    // 6. Click 'Continue' ('[data-qa="continue-button"]'), then click the header 'Delete Account' link
    // to remove this test's disposable account.
    await checkoutPage.continueButton.click();
    // expect: 'Continue' navigates to '/'.
    await expect(page).toHaveURL('/');
    await loginPage.deleteAccountNavLink.click();

    // expect: The Delete Account flow shows the standard 'Account Deleted!' heading and 'Your account
    // has been permanently deleted!' text.
    await expect(signupPage.accountDeletedHeading).toBeVisible();
    await expect(page.getByText('Your account has been permanently deleted!')).toBeVisible();
  });
});
