// spec: specs/checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { LoginPage } from '../../pages/LoginPage';
import { ProductDetailsPage } from '../../pages/ProductDetailsPage';
import { SignupPage, generateTestUser } from '../../pages/SignupPage';

/** Parse the numeric value out of a "Rs. NNN" price string. */
function parsePrice(text: string): number {
  return Number(text.replace(/[^\d]/g, ''));
}

test.describe('Checkout / Orders', () => {
  test("Order review table's Total Amount equals the sum of two differently-priced product line totals (multi-item checkout arithmetic)", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    const { name, email, password } = generateTestUser('Multi Item Total');

    // 1. Generate a disposable test user via SignupPage.generateTestUser() and register+log in
    // via SignupPage.registerAndLogin(loginPage, name, email, password) (same default
    // account-information values as Scenario 1.1). Add product 1 ('Blue Top') to the cart via
    // ProductDetailsPage.addToCartAndViewCart(1), then separately navigate to product 2
    // ('Men Tshirt', /product_details/2), add it to the cart too (dismissing the 'Added!'
    // confirmation modal via 'Continue Shopping'), and land on /view_cart.
    await signupPage.registerAndLogin(loginPage, name, email, password);
    await productDetailsPage.addToCartAndViewCart(1);

    await productDetailsPage.gotoProduct(2);
    await productDetailsPage.addToCart();
    await productDetailsPage.continueShoppingButton.click();
    await cartPage.gotoCart();

    // expect: The header shows text containing 'Logged in as {name}' for this disposable account.
    await expect(page).toHaveURL(/\/view_cart$/);
    await expect(loginPage.loggedInAsText).toContainText(`Logged in as ${name}`);
    // expect: '#cart_info_table' on /view_cart contains exactly 2 rows: one for 'Blue Top'
    // showing unit price 'Rs. 500', quantity '1', line total 'Rs. 500', and one for 'Men Tshirt'
    // showing unit price 'Rs. 400', quantity '1', line total 'Rs. 400' -- live-confirmed distinct,
    // non-equal unit prices, a precondition for this scenario's summation check to be meaningful.
    await expect(cartPage.cartRows).toHaveCount(2);
    await expect(cartPage.rowUnitPrice(1)).toHaveText('Rs. 500');
    await expect(cartPage.rowQuantityControl(1)).toHaveText('1');
    await expect(cartPage.rowLineTotal(1)).toHaveText('Rs. 500');
    await expect(cartPage.rowUnitPrice(2)).toHaveText('Rs. 400');
    await expect(cartPage.rowQuantityControl(2)).toHaveText('1');
    await expect(cartPage.rowLineTotal(2)).toHaveText('Rs. 400');

    // 2. Still on /view_cart, read both products' own unit price text from their respective rows,
    // parse the numeric value out of each 'Rs. NNN' string, and compute their sum programmatically
    // as `expectedTotal` -- never hardcode a literal expected total.
    const product1UnitPriceText = await cartPage.rowUnitPrice(1).innerText();
    const product2UnitPriceText = await cartPage.rowUnitPrice(2).innerText();
    const expectedTotal = parsePrice(product1UnitPriceText) + parsePrice(product2UnitPriceText);

    // expect: `expectedTotal` is computed as the sum of the two parsed unit-price numbers read
    // above, expressed as an arithmetic sum rather than a hardcoded constant.
    expect(expectedTotal).toBe(parsePrice(product1UnitPriceText) + parsePrice(product2UnitPriceText));

    // 3. Click 'Proceed To Checkout' (CheckoutPage.proceedToCheckoutFromCart(cartPage)) to reach
    // '/checkout'. Since the account is already logged in, no '#checkoutModal' login-gate modal
    // should appear.
    await checkoutPage.proceedToCheckoutFromCart(cartPage);

    // expect: The resulting page URL equals exactly '/checkout'.
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(cartPage.checkoutModal).toBeHidden();
    // expect: The order review table ('#cart_info table') renders exactly 2 product rows via
    // CheckoutPage.productRows -- one row for 'Blue Top' and one row for 'Men Tshirt' -- each
    // showing its own unit price, quantity '1', and a line total equal to its own unit price
    // (since quantity is 1 for both), followed immediately by the 'Total Amount' summary row.
    await expect(checkoutPage.productRows).toHaveCount(2);
    await expect(checkoutPage.productRows.locator('.cart_description h4 a').nth(0)).toHaveText('Blue Top');
    await expect(checkoutPage.productRows.locator('.cart_description h4 a').nth(1)).toHaveText('Men Tshirt');
    await expect(checkoutPage.productRows.locator('.cart_quantity button')).toHaveText(['1', '1']);
    await expect(checkoutPage.totalAmountRow).toBeVisible();

    // 4. Read each product row's line total text via
    // `checkoutPage.productRows.locator('.cart_total p').allInnerTexts()`, parse the numeric value
    // out of each 'Rs. NNN' string, and sum the two parsed values programmatically as
    // `sumOfLineTotals`. Separately, read the 'Total Amount' row's value text via
    // CheckoutPage.totalAmountValue and parse its numeric value as `displayedTotal`.
    const lineTotalTexts = await checkoutPage.productRows.locator('.cart_total p').allInnerTexts();
    const sumOfLineTotals = lineTotalTexts.reduce((sum, text) => sum + parsePrice(text), 0);
    const displayedTotalText = await checkoutPage.totalAmountValue.innerText();
    const displayedTotal = parsePrice(displayedTotalText);

    // expect: `sumOfLineTotals` equals `expectedTotal` from the earlier /view_cart step -- the two
    // rows' own line totals on /checkout sum to the exact same numeric value as the two products'
    // own unit prices summed on /view_cart.
    expect(sumOfLineTotals).toBe(expectedTotal);
    // expect: `displayedTotal` equals exactly `sumOfLineTotals` -- the '/checkout' review table's
    // 'Total Amount' row is the arithmetic sum of its own 2 product rows' line totals.
    expect(displayedTotal).toBe(sumOfLineTotals);

    // 5. Deliberately stop here -- do NOT click 'Place Order', and do NOT proceed to '/payment'.
    // Click the header 'Delete Account' link to remove this scenario's disposable account.
    await loginPage.deleteAccountNavLink.click();

    // expect: The standard 'Account Deleted!' heading and 'Your account has been permanently
    // deleted!' text are shown, confirming cleanup succeeds even though this account still had a
    // non-empty, unpurchased 2-item cart at the time of deletion and zero real orders were ever
    // placed under it during this scenario.
    await expect(signupPage.accountDeletedHeading).toBeVisible();
    await expect(signupPage.accountDeletedConfirmationText).toBeVisible();
  });
});
