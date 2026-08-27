// spec: specs/account.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage, generateTestUser } from '../pages/SignupPage';

test.describe('Login', () => {
  test('Invalid login credentials show an inline error and do not authenticate', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // 1. Navigate to https://automationexercise.com/login (fresh/blank browser state, not logged in).
    // Confirm both the 'Login to your account' email/password fields and the 'New User Signup!'
    // name/email fields are present and empty (no pre-filled default values were observed during exploration).
    await loginPage.gotoLogin();
    await expect(loginPage.loginHeading).toBeVisible();
    await expect(loginPage.signupHeading).toBeVisible();
    await expect(loginPage.loginEmailInput).toHaveValue('');
    await expect(loginPage.loginPasswordInput).toHaveValue('');

    // 2. Fill data-qa='login-email' with a syntactically valid but non-existent email (e.g. a
    // timestamp-suffixed address that has never been registered) and data-qa='login-password'
    // with any non-empty string, then click data-qa='login-button'.
    const nonExistentEmail = `nonexistent.user.${Date.now()}@example.com`;
    await loginPage.loginWithCredentials(nonExistentEmail, 'WrongPassword123');
    await expect(page).toHaveURL('/login');
    await expect(loginPage.loginErrorMessage).toHaveText('Your email or password is incorrect!');
    await expect(loginPage.signupLoginNavLink).toBeVisible();
  });

  test('Valid login authenticates and updates the header to the logged-in state', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);

    const { name: fixtureName, email: fixtureEmail, password: fixturePassword } = generateTestUser('Test User');

    // Fixture setup (not a numbered scenario step): create the account this test logs into,
    // via the New User Signup -> Account Information -> Account Created flow, then log out so
    // the login attempt below starts from a clean, logged-out session.
    await signupPage.registerAndLogin(loginPage, fixtureName, fixtureEmail, fixturePassword);
    await expect(page).toHaveURL('/');
    await loginPage.logoutNavLink.click();
    await expect(page).toHaveURL('/login');

    // 1. Using a fixture account created via the Signup flow at the start of this test (unique
    // email/password generated for this run), navigate to /login, fill data-qa='login-email' and
    // data-qa='login-password' with that account's credentials, and click data-qa='login-button'.
    await loginPage.gotoLogin();
    await loginPage.loginWithCredentials(fixtureEmail, fixturePassword);
    await expect(page).toHaveURL('/');
    await expect(loginPage.signupLoginNavLink).toBeHidden();
    await expect(loginPage.logoutNavLink).toHaveAttribute('href', '/logout');
    await expect(loginPage.deleteAccountNavLink).toHaveAttribute('href', '/delete_account');
    await expect(loginPage.loggedInAsText).toContainText(`Logged in as ${fixtureName}`);

    // 2. Clean up: navigate to /delete_account to remove the fixture account created for this test.
    await loginPage.goto('/delete_account');
    await expect(signupPage.accountDeletedHeading).toBeVisible();
  });
});
