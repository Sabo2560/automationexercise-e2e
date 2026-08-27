// spec: specs/account.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Validation', () => {
  test('Missing email or password on the login form is blocked before submission', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // 1. On a freshly loaded /login page, leave data-qa='login-email' empty, fill
    // data-qa='login-password' with any value, and click data-qa='login-button'.
    await loginPage.gotoLogin();
    await loginPage.loginPasswordInput.fill('SomePassword123');
    await loginPage.loginButton.click();

    await expect(page).toHaveURL('/login');
    await expect(loginPage.loginErrorMessage).toHaveCount(0);

    const emailValidity = await loginPage.loginEmailInput.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      valueMissing: el.validity.valueMissing,
    }));
    expect(emailValidity.valid).toBe(false);
    expect(emailValidity.valueMissing).toBe(true);
  });
});
