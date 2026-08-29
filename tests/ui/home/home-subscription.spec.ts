// spec: specs/home.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { generateTestUser } from '../../pages/SignupPage';

test.describe('Newsletter Subscription', () => {
  test('[P2] Newsletter subscription accepts a valid email and shows the success confirmation', async ({ page }) => {
    const homePage = new HomePage(page);

    // 1. On the home page, scroll to the footer Subscription box. Confirm the email input is
    // empty (fresh state, no pre-filled value). Fill it with a syntactically valid, unique email
    // address (timestamp/random-suffixed, matching SignupPage's generateTestUser() pattern) and
    // click the subscribe (arrow) button.
    await homePage.gotoHome();
    await homePage.scrollToBottom();
    await expect(homePage.subscribeEmailInput).toHaveValue('');

    const { email: uniqueEmail } = generateTestUser('Home Subscriber');
    await homePage.subscribe(uniqueEmail);

    // expect: Immediately after the click, a green success element with class 'alert-success'
    // becomes visible in the DOM containing the exact text 'You have been successfully
    // subscribed!'.
    await expect(homePage.subscribeSuccessAlert).toBeVisible();
    await expect(homePage.subscribeSuccessAlert).toHaveText('You have been successfully subscribed!');

    // expect: The alert stays visible for a fixed ~1500ms and only then does its ancestor
    // re-gain the 'hide' class in the same callback that clears the email input. The input's
    // value must NOT be asserted as '' immediately after the alert is visible; instead wait for
    // the alert to become hidden again (with a timeout comfortably over 1500ms) and only then
    // assert the input has reset to ''.
    await expect(homePage.subscribeSuccessAlert).toBeHidden({ timeout: 5000 });
    await expect(homePage.subscribeEmailInput).toHaveValue('');
  });

  test('[P2] Newsletter subscription rejects empty email via native HTML5 validation', async ({ page }) => {
    const homePage = new HomePage(page);

    // 1. On the home page, scroll to the footer Subscription box. Leave the email input empty
    // and click the subscribe button.
    await homePage.gotoHome();
    await homePage.scrollToBottom();
    await homePage.subscribeButton.click();

    // expect: The '.alert-success' element never becomes visible (subscription is not accepted).
    await expect(homePage.subscribeSuccessAlert).not.toBeVisible();

    // expect: The email input element's validity.valid is false and validity.valueMissing is
    // true (native required-field validation fires because the input has the HTML5 required
    // attribute), confirmed by evaluating the input's ValidityState in-page.
    const validity = await homePage.subscribeEmailInput.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      valueMissing: el.validity.valueMissing,
    }));
    expect(validity.valid).toBe(false);
    expect(validity.valueMissing).toBe(true);
  });

  test('[P2] Newsletter subscription rejects malformed email via native HTML5 validation', async ({ page }) => {
    const homePage = new HomePage(page);

    // 1. On the home page, scroll to the footer Subscription box. Type a string with no '@'
    // symbol (e.g. 'notanemail') into the email input and click the subscribe button.
    await homePage.gotoHome();
    await homePage.scrollToBottom();
    await homePage.subscribeEmailInput.fill('notanemail');
    await homePage.subscribeButton.click();

    // expect: The '.alert-success' element never becomes visible.
    await expect(homePage.subscribeSuccessAlert).not.toBeVisible();

    // expect: The email input element's validity.valid is false and validity.typeMismatch is
    // true (native type=email validation fires), confirmed by evaluating the input's
    // ValidityState in-page.
    const validity = await homePage.subscribeEmailInput.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      typeMismatch: el.validity.typeMismatch,
    }));
    expect(validity.valid).toBe(false);
    expect(validity.typeMismatch).toBe(true);
  });
});
