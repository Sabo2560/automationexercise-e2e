// spec: specs/cart.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SignupPage, generateTestUser } from '../../pages/SignupPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { ProductDetailsPage } from '../../pages/ProductDetailsPage';
import { CartPage } from '../../pages/CartPage';

// Confirmed live during generation: searching 'Dress' on '/products' returns 'Sleeveless Dress'
// (id 3, 'Rs. 1000', category 'Women > Dress') as its first result. Per the plan, these are
// treated as known catalog fixture values (matching this project's existing convention in
// cart-display.spec.ts of hardcoding confirmed product id/name/price/category rather than
// scraping them, since the product-details page's category paragraph is also known to be
// polluted by unrelated third-party in-text ad links -- e.g. the literal word 'Dress' getting
// wrapped in an ad anchor -- making it an unreliable source to scrape live).
const SEARCHED_PRODUCT_ID = 3;
const SEARCHED_PRODUCT_NAME = 'Sleeveless Dress';
const SEARCHED_PRODUCT_CATEGORY = 'Women > Dress';
const SEARCHED_PRODUCT_UNIT_PRICE = 'Rs. 1000';
const SEARCHED_PRODUCT_QUANTITY = 1;
const SEARCHED_PRODUCT_LINE_TOTAL = `Rs. ${1000 * SEARCHED_PRODUCT_QUANTITY}`;

test.describe('Search, Add to Cart, and Cart Persistence Across Login', () => {
  test('A product added to the cart while logged out is still present in the cart after logging in via the header nav', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);
    const productsPage = new ProductsPage(page);
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);

    const { name, email, password } = generateTestUser('Cart Search Login');

    // 1. Generate a unique disposable user via generateTestUser(). Use LoginPage.gotoLogin()
    // + SignupPage.registerAndLogin() to register and land logged-in on '/'. Confirm header
    // shows 'Logged in as {name}' and Logout/Delete Account links are visible.
    await signupPage.registerAndLogin(loginPage, name, email, password);
    await expect(page).toHaveURL('/');
    await expect(loginPage.loggedInAsText).toContainText(`Logged in as ${name}`);
    await expect(loginPage.logoutNavLink).toBeVisible();
    await expect(loginPage.deleteAccountNavLink).toBeVisible();

    // 2. Click header logoutNavLink. Confirm resulting URL is '/login' and header shows
    // signupLoginNavLink again (logged out).
    await loginPage.logoutNavLink.click();
    await expect(page).toHaveURL('/login');
    await expect(loginPage.signupLoginNavLink).toBeVisible();
    await expect(loginPage.logoutNavLink).toBeHidden();
    await expect(loginPage.deleteAccountNavLink).toBeHidden();

    // 3. As this logged-out user, ProductsPage.gotoProducts() then search('Dress'). Confirm
    // 'Searched Products' heading visible and getProductCount() >= 1.
    await productsPage.gotoProducts();
    await productsPage.search('Dress');
    await expect(productsPage.searchedProductsHeading).toBeVisible();
    expect(await productsPage.getProductCount()).toBeGreaterThanOrEqual(1);

    // 4. Click the first search result's 'View Product' link, then on the product detail page
    // click 'Add to cart' and wait for '#cartModal' to show 'Added!' / 'Your product has been
    // added to cart.'. Do NOT click View Cart from the modal -- instead navigate directly to
    // /login for the next step.
    await productsPage.productViewProductLink(SEARCHED_PRODUCT_ID).click();
    await expect(page).toHaveURL(`/product_details/${SEARCHED_PRODUCT_ID}`);
    await productDetailsPage.addToCart();
    await expect(productDetailsPage.cartModalAddedHeading).toBeVisible();
    await expect(productDetailsPage.cartModalMessage).toBeVisible();

    // 5. Use LoginPage.loginWithCredentials() with the SAME disposable account's email/password
    // from step 1 (the HEADER NAV login path). Confirm resulting URL is '/' and header shows
    // 'Logged in as {name}' again.
    await loginPage.gotoLogin();
    await loginPage.loginWithCredentials(email, password);
    await expect(page).toHaveURL('/');
    await expect(loginPage.loggedInAsText).toContainText(`Logged in as ${name}`);

    // 6. Navigate to /view_cart via CartPage.gotoCart(). Confirm the cart table has at least 1
    // row, and specifically that the row for the product added anonymously in step 4 is
    // present with correct name/href, category, unit price, quantity '1', and line total =
    // unit price x 1.
    await cartPage.gotoCart();
    await expect(cartPage.cartTable).toBeVisible();
    expect(await cartPage.getRowCount()).toBeGreaterThanOrEqual(1);

    await expect(cartPage.rowNameLink(SEARCHED_PRODUCT_ID)).toHaveText(SEARCHED_PRODUCT_NAME);
    await expect(cartPage.rowNameLink(SEARCHED_PRODUCT_ID)).toHaveAttribute(
      'href',
      `/product_details/${SEARCHED_PRODUCT_ID}`,
    );
    await expect(cartPage.rowCategory(SEARCHED_PRODUCT_ID)).toHaveText(SEARCHED_PRODUCT_CATEGORY);
    await expect(cartPage.rowUnitPrice(SEARCHED_PRODUCT_ID)).toHaveText(SEARCHED_PRODUCT_UNIT_PRICE);
    await expect(cartPage.rowQuantityControl(SEARCHED_PRODUCT_ID)).toHaveText(String(SEARCHED_PRODUCT_QUANTITY));
    await expect(cartPage.rowLineTotal(SEARCHED_PRODUCT_ID)).toHaveText(SEARCHED_PRODUCT_LINE_TOTAL);

    // 7. Click header deleteAccountNavLink while the cart still has that item (do not delete
    // the cart item first). Confirm 'Account Deleted!' heading visible, then click Continue and
    // confirm header reverts to signupLoginNavLink (logged out, session fully gone).
    await loginPage.deleteAccountNavLink.click();
    await expect(page).toHaveURL('/delete_account');
    await expect(signupPage.accountDeletedHeading).toBeVisible();
    await expect(page.getByText('Your account has been permanently deleted!')).toBeVisible();
    await signupPage.continueButton.click();
    await expect(loginPage.signupLoginNavLink).toBeVisible();
    await expect(loginPage.loggedInAsText).toBeHidden();
  });
});
