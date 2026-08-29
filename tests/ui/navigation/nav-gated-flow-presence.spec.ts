// spec: specs/navigation.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { LoginPage } from '../../pages/LoginPage';
import { ProductDetailsPage } from '../../pages/ProductDetailsPage';
import { SignupPage, generateTestUser } from '../../pages/SignupPage';

// The 6 static header nav locators that remain unaffected by auth state (Signup/Login is
// excluded here since it's replaced entirely once logged in), keyed by name, plus their
// confirmed expected href — per Scenario 1's live findings, reused here as the comparison
// baseline for the deep-gated pages checked below.
const STATIC_NAV_HREFS: Record<string, string> = {
  Home: '/',
  Products: '/products',
  Cart: '/view_cart',
  'Test Cases': '/test_cases',
  'API Testing': '/api_list',
  'Video Tutorials': 'https://www.youtube.com/c/AutomationExercise',
  'Contact us': '/contact_us',
};

/**
 * Assert the 6 unaffected static nav items plus the 3 logged-in-state items (Logout,
 * Delete Account, Logged-in-as) are all visible on the given page object, with the same
 * hrefs/text captured in `registeredName` — used to confirm the nav bar is identical on
 * Home, '/checkout', and '/payment'.
 */
async function expectLoggedInNavContract(basePage: BasePage, registeredName: string) {
  const staticLinksByName: Record<string, typeof basePage.homeNavLink> = {
    Home: basePage.homeNavLink,
    Products: basePage.productsNavLink,
    Cart: basePage.cartNavLink,
    'Test Cases': basePage.testCasesNavLink,
    'API Testing': basePage.apiTestingNavLink,
    'Video Tutorials': basePage.videoTutorialsNavLink,
    'Contact us': basePage.contactUsNavLink,
  };

  for (const [name, expectedHref] of Object.entries(STATIC_NAV_HREFS)) {
    const link = staticLinksByName[name];
    await expect(link).toBeVisible();
    expect(await basePage.getHref(link)).toBe(expectedHref);
  }

  await expect(basePage.logoutNavLink).toBeVisible();
  expect(await basePage.getHref(basePage.logoutNavLink)).toBe('/logout');
  await expect(basePage.deleteAccountNavLink).toBeVisible();
  expect(await basePage.getHref(basePage.deleteAccountNavLink)).toBe('/delete_account');
  await expect(basePage.loggedInAsText).toContainText(`Logged in as ${registeredName}`);
}

test.describe('Cross-Page Nav Presence', () => {
  test('Header nav bar remains present and correct through the deepest gated flow (Checkout, Payment)', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    const { name, email, password } = generateTestUser('Nav Gated Flow');

    // 1. Generate a unique synthetic test user. Add one product to the cart from a
    // ProductDetailsPage (product id 1), then view the cart.
    await productDetailsPage.gotoProduct(1);
    await productDetailsPage.addToCartAndViewCart(1);

    // expect: The cart shows exactly 1 line item for the added product before proceeding.
    await expect(page).toHaveURL(/\/view_cart$/);
    await expect(cartPage.cartRows).toHaveCount(1);

    // 2. Click Proceed to Checkout while NOT logged in, follow the login-gate modal's
    // 'Register / Login' link, complete the New User Signup mini-form and the full Account
    // Information form via SignupPage, landing logged-in on Home.
    await cartPage.clickProceedToCheckout();
    await cartPage.checkoutModalLoginLink.click();
    await signupPage.registerAndLogin(loginPage, name, email, password);

    // expect: Confirmed logged in: signupLoginNavLink is gone, replaced by logoutNavLink,
    // deleteAccountNavLink, and loggedInAsText containing the registered account's name —
    // this is the baseline logged-in nav state used for comparison in the next steps.
    await expect(page).toHaveURL('/');
    await expect(loginPage.signupLoginNavLink).toBeHidden();
    await expectLoggedInNavContract(loginPage, name);

    // 3. Navigate back to /view_cart, click Proceed to Checkout again (now logged in),
    // landing on /checkout.
    await cartPage.gotoCart();
    await checkoutPage.proceedToCheckoutFromCart(cartPage);

    // expect: Page URL is exactly '/checkout', CheckoutPage.addressDetailsHeading is
    // visible, AND all 9 nav items (6 static + Logout + Delete Account + Logged-in-as) are
    // visible with the same hrefs/text confirmed on Home in the previous step.
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(checkoutPage.addressDetailsHeading).toBeVisible();
    await expectLoggedInNavContract(checkoutPage, name);

    // 4. From /checkout, click Place Order to land on /payment.
    await checkoutPage.clickPlaceOrder();

    // expect: Page URL is exactly '/payment', CheckoutPage.paymentHeading is visible, AND
    // all 9 nav items are STILL visible with the same hrefs/text as on /checkout and Home.
    await expect(page).toHaveURL(/\/payment$/);
    await expect(checkoutPage.paymentHeading).toBeVisible();
    await expectLoggedInNavContract(checkoutPage, name);

    // 5. Cleanup (required, do not skip): navigate to '/delete_account' (while still logged
    // in from this same session) to delete the disposable test account created in step 1.
    await checkoutPage.goto('/delete_account');

    // expect: SignupPage.accountDeletedHeading ('Account Deleted!') becomes visible,
    // confirming the account was removed and no orphaned account is left behind.
    await expect(signupPage.accountDeletedHeading).toBeVisible();
  });
});
