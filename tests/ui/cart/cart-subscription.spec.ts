// spec: specs/cart.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CartPage } from '../../pages/CartPage';
import { generateTestUser } from '../../pages/SignupPage';

test.describe('Footer Subscription on Cart Page (TC11 audit gap)', () => {
  test('Newsletter subscription on the Cart page accepts a valid unique email and shows the success confirmation', async ({ page }) => {
    const cartPage = new CartPage(page);

    // Confirms the widget remains client-side-only on this page too: no request to a backend
    // '/subscribe'-style endpoint should ever be observed (static assets like subscription.js
    // legitimately contain the substring "subscribe" in their filename and must not be
    // mistaken for a backend call).
    const backendSubscribeRequests: string[] = [];
    page.on('request', (request) => {
      const { pathname } = new URL(request.url());
      if (/\/subscribe/i.test(pathname) && !pathname.endsWith('.js')) {
        backendSubscribeRequests.push(request.url());
      }
    });

    // 1. Navigate to /view_cart (starting state does not matter for this widget; this scenario
    // uses the fresh/empty-cart starting state for independence from other scenarios). Confirm
    // the footer email input ('#susbscribe_email') is empty (fresh state, no pre-filled value),
    // then fill it with a syntactically valid, unique email address (timestamp/random-suffixed,
    // matching the pattern used by SignupPage's generateTestUser()) and click the subscribe
    // button ('#subscribe').
    await cartPage.gotoCart();
    await expect(cartPage.subscribeEmailInput).toHaveValue('');

    const { email: uniqueEmail } = generateTestUser('Cart Subscriber');
    await cartPage.subscribe(uniqueEmail);

    // expect: A green success element with class 'alert-success' becomes visible in the DOM
    // containing the exact text 'You have been successfully subscribed!'.
    await expect(cartPage.subscribeSuccessAlert).toBeVisible();
    await expect(cartPage.subscribeSuccessAlert).toHaveText('You have been successfully subscribed!');

    // expect: The email input's value is reset to an empty string after submission.
    await expect(cartPage.subscribeEmailInput).toHaveValue('');

    // expect: No network request to a backend '/subscribe'-style endpoint is observed as a
    // result of this click, confirming this remains a client-side-only feature on the Cart
    // page as well as on Home.
    expect(backendSubscribeRequests).toEqual([]);
  });
});
