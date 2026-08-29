// spec: specs/navigation.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { LoginPage } from '../../pages/LoginPage';
import { SignupPage, generateTestUser } from '../../pages/SignupPage';

test.describe('Authenticated Nav State', () => {
  test('Signup/Login nav item correctly transitions to Logout/Delete Account/Logged-in-as after auth, and reverts on Logout', async ({
    page,
  }) => {
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);

    const { name, email, password } = generateTestUser('Nav Auth State');

    // 1. Assume a fresh, unauthenticated context. Instantiate HomePage, navigate to '/'.
    // Confirm the logged-out baseline nav state before registering anything.
    await homePage.gotoHome();

    // expect: signupLoginNavLink ('Signup / Login', href '/login') is visible, AND
    // logoutNavLink, deleteAccountNavLink, and loggedInAsText are all NOT present/visible.
    await expect(homePage.signupLoginNavLink).toBeVisible();
    expect(await homePage.getHref(homePage.signupLoginNavLink)).toBe('/login');
    await expect(homePage.logoutNavLink).toBeHidden();
    await expect(homePage.deleteAccountNavLink).toBeHidden();
    await expect(homePage.loggedInAsText).toBeHidden();

    // 2. Generate a unique synthetic test user matching SignupPage.generateTestUser()'s
    // pattern. Register it via registerAndLogin, landing logged-in on Home.
    await signupPage.registerAndLogin(loginPage, name, email, password);

    // expect: signupLoginNavLink is now NOT present. In its place: logoutNavLink is
    // visible with href '/logout', deleteAccountNavLink is visible with href
    // '/delete_account', and loggedInAsText is visible and contains the exact
    // registered name.
    await expect(page).toHaveURL('/');
    await expect(homePage.signupLoginNavLink).toBeHidden();
    await expect(homePage.logoutNavLink).toBeVisible();
    expect(await homePage.getHref(homePage.logoutNavLink)).toBe('/logout');
    await expect(homePage.deleteAccountNavLink).toBeVisible();
    expect(await homePage.getHref(homePage.deleteAccountNavLink)).toBe('/delete_account');
    await expect(homePage.loggedInAsText).toContainText(`Logged in as ${name}`);

    // 3. Click logoutNavLink.
    await homePage.logoutNavLink.click();

    // expect: Page URL is exactly '/login', LoginPage.loginHeading is visible, AND the
    // nav bar has reverted: signupLoginNavLink is visible again while logoutNavLink,
    // deleteAccountNavLink, and loggedInAsText are all no longer present — confirming
    // Logout both ends the session and restores the original logged-out nav state,
    // matching step 1's baseline exactly.
    await expect(page).toHaveURL('/login');
    await expect(loginPage.loginHeading).toBeVisible();
    await expect(loginPage.signupLoginNavLink).toBeVisible();
    expect(await loginPage.getHref(loginPage.signupLoginNavLink)).toBe('/login');
    await expect(loginPage.logoutNavLink).toBeHidden();
    await expect(loginPage.deleteAccountNavLink).toBeHidden();
    await expect(loginPage.loggedInAsText).toBeHidden();

    // 4. Cleanup (required, do not skip): log back in with the same generated
    // credentials, then navigate to '/delete_account' and delete the fixture account.
    await loginPage.loginWithCredentials(email, password);

    // expect: Login succeeds (landing on '/' with the logged-in nav state visible
    // again), then SignupPage.accountDeletedHeading ('Account Deleted!') becomes
    // visible after the delete step, confirming no orphaned account is left behind.
    await expect(page).toHaveURL('/');
    await expect(loginPage.logoutNavLink).toBeVisible();
    await signupPage.goto('/delete_account');
    await expect(signupPage.accountDeletedHeading).toBeVisible();
  });
});
