// spec: specs/account.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage, generateTestUser } from '../pages/SignupPage';

test.describe('Delete Account', () => {
  test('Delete Account permanently removes the account and immediately logs the user out', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);

    const { name, email, password } = generateTestUser('Delete Test User');

    // 1. Set up by registering a fresh account via the full Signup -> Account Information flow
    // (unique email), confirming the post-registration logged-in state (header shows
    // 'Logged in as {name}').
    await signupPage.registerAndLogin(loginPage, name, email, password);
    await expect(page).toHaveURL('/');
    await expect(loginPage.logoutNavLink).toBeVisible();
    await expect(loginPage.deleteAccountNavLink).toBeVisible();
    await expect(loginPage.loggedInAsText).toContainText(`Logged in as ${name}`);

    // 2. Click the header 'Delete Account' link (or navigate directly to /delete_account).
    // No confirmation dialog/prompt should appear before the deletion takes effect.
    let dialogAppeared = false;
    page.on('dialog', () => {
      dialogAppeared = true;
    });
    await loginPage.deleteAccountNavLink.click();
    await expect(page).toHaveURL('/delete_account');
    expect(dialogAppeared).toBe(false);
    await expect(signupPage.accountDeletedHeading).toBeVisible();
    await expect(page.getByText('Your account has been permanently deleted!')).toBeVisible();
    await expect(signupPage.continueButton).toHaveAttribute('href', '/');
    await expect(loginPage.signupLoginNavLink).toBeVisible();
    await expect(loginPage.logoutNavLink).toBeHidden();
    await expect(loginPage.deleteAccountNavLink).toBeHidden();
    await expect(loginPage.loggedInAsText).toBeHidden();

    // 3. Attempt to log back in at /login using the just-deleted account's exact email/password.
    await loginPage.gotoLogin();
    await loginPage.loginWithCredentials(email, password);
    await expect(page).toHaveURL('/login');
    await expect(loginPage.loginErrorMessage).toHaveText('Your email or password is incorrect!');
    await expect(loginPage.signupLoginNavLink).toBeVisible();
  });
});
