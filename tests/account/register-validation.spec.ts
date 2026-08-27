// spec: specs/account.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage, generateTestUser } from '../pages/SignupPage';

test.describe('Registration Validation', () => {
  test('Leaving a required Account Information field empty blocks Create Account submission', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);

    const { name, email } = generateTestUser('Validation Test');

    // 1. Reach the /signup Account Information form via the New User Signup mini-form
    // (unique test email). Fill every required field EXCEPT data-qa='first_name'
    // (leave it empty), then click data-qa='create-account'.
    await loginPage.gotoLogin();
    await loginPage.startSignup(name, email);
    await expect(signupPage.accountInformationHeading).toBeVisible();
    await signupPage.fillAccountInformation({ password: 'TestPass123!', firstName: '' });
    await signupPage.submit();

    await expect(page).toHaveURL('/signup');

    const firstNameValidity = await signupPage.firstNameInput.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      valueMissing: el.validity.valueMissing,
    }));
    expect(firstNameValidity.valid).toBe(false);
    expect(firstNameValidity.valueMissing).toBe(true);
  });
});
