// spec: specs/account.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage, generateTestUser } from '../pages/SignupPage';

test.describe('Logout and Delete Account', () => {
  test('Logout ends the session and reverts the header to the logged-out state', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);

    const { name, email, password } = generateTestUser('Logout Test User');

    // 1. Set up by registering a fresh account via the full Signup -> Account Information flow
    // (unique email) so the browser is in a logged-in state. Confirm the header shows
    // 'Logged in as {name}' before proceeding.
    await signupPage.registerAndLogin(loginPage, name, email, password);
    await expect(page).toHaveURL('/');
    await expect(loginPage.logoutNavLink).toBeVisible();
    await expect(loginPage.deleteAccountNavLink).toBeVisible();
    await expect(loginPage.loggedInAsText).toContainText(`Logged in as ${name}`);

    // 2. Click the header 'Logout' link.
    await loginPage.logoutNavLink.click();
    await expect(page).toHaveURL('/login');
    await expect(loginPage.logoutNavLink).toBeHidden();
    await expect(loginPage.deleteAccountNavLink).toBeHidden();
    await expect(loginPage.loggedInAsText).toBeHidden();
    await expect(loginPage.signupLoginNavLink).toBeVisible();
    await expect(loginPage.loginEmailInput).toHaveValue('');
    await expect(loginPage.loginPasswordInput).toHaveValue('');
    await expect(loginPage.signupNameInput).toHaveValue('');
    await expect(loginPage.signupEmailInput).toHaveValue('');

    // 3. Clean up: log back in with the account's credentials and navigate to /delete_account.
    await loginPage.loginWithCredentials(email, password);
    await expect(page).toHaveURL('/');
    await loginPage.goto('/delete_account');
    await expect(signupPage.accountDeletedHeading).toBeVisible();
  });
});
