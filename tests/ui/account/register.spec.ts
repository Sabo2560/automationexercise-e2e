// spec: specs/account.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SignupPage, generateTestUser } from '../../pages/SignupPage';

test.describe('Registration', () => {
  test('Full registration flow: New User Signup -> Account Information -> Account Created -> logged in', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);

    const { name, email, password } = generateTestUser('Test User');

    // 1. Navigate to /login (fresh/blank state). In the 'New User Signup!' section, fill
    // data-qa='signup-name' with a test name and data-qa='signup-email' with a newly generated
    // unique email (timestamp/random suffix), then click data-qa='signup-button'.
    await loginPage.gotoLogin();
    await loginPage.startSignup(name, email);
    await expect(page).toHaveURL('/signup');
    await expect(signupPage.accountInformationHeading).toBeVisible();
    await expect(signupPage.nameInput).toHaveValue(name);
    await expect(signupPage.nameInput).toBeEditable();
    await expect(signupPage.emailInput).toHaveValue(email);
    await expect(signupPage.emailInput).toBeDisabled();

    // 2. Complete all required Account Information fields: select the 'Mr.' title radio, fill
    // data-qa='password' with a test password, select a day/month/year from the
    // data-qa='days'/'months'/'years' selects, fill data-qa='first_name', data-qa='last_name',
    // data-qa='address', select a country from data-qa='country', fill data-qa='state',
    // data-qa='city', data-qa='zipcode', and data-qa='mobile_number'. Leave optional fields
    // (Company, Address 2, both newsletter checkboxes) untouched. Click data-qa='create-account'.
    await signupPage.fillAccountInformation({ password });
    await signupPage.submit();
    await expect(page).toHaveURL('/account_created');
    await expect(signupPage.accountCreatedHeading).toBeVisible();
    await expect(page.getByText('Congratulations! Your new account has been successfully created!')).toBeVisible();
    await expect(signupPage.continueButton).toBeVisible();

    // 3. Click the 'Continue' link.
    await signupPage.continueButton.click();
    await expect(page).toHaveURL('/');
    await expect(loginPage.logoutNavLink).toBeVisible();
    await expect(loginPage.deleteAccountNavLink).toBeVisible();
    await expect(loginPage.loggedInAsText).toContainText(`Logged in as ${name}`);

    // 4. Clean up: navigate to /delete_account to remove the account created in this test.
    await loginPage.goto('/delete_account');
    await expect(signupPage.accountDeletedHeading).toBeVisible();
    await expect(page.getByText('Your account has been permanently deleted!')).toBeVisible();
    await expect(loginPage.signupLoginNavLink).toBeVisible();
  });

  test('Registering with an email that already belongs to an existing account is rejected with an inline error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);

    const { name: fixtureName, email: fixtureEmail, password: fixturePassword } = generateTestUser('Dup Fixture');

    // 1. Setup (within this same test, so the fixture is self-contained): create a real account
    // via the full New User Signup -> Account Information -> Account Created flow using a freshly
    // generated unique email, then log out via the header 'Logout' link so the session is clean.
    await signupPage.registerAndLogin(loginPage, fixtureName, fixtureEmail, fixturePassword);
    await expect(page).toHaveURL('/');
    await loginPage.logoutNavLink.click();
    await expect(page).toHaveURL('/login');
    await expect(loginPage.signupLoginNavLink).toBeVisible();

    // 2. On the /login page, fill the 'New User Signup!' data-qa='signup-name' with any name and
    // data-qa='signup-email' with the SAME email used in the setup step above (the one already
    // registered), then click data-qa='signup-button'.
    await loginPage.startSignup('Another Name', fixtureEmail);
    await expect(page).toHaveURL('/signup');
    await expect(loginPage.loginHeading).toBeVisible();
    await expect(signupPage.accountInformationHeading).toBeHidden();
    await expect(loginPage.signupErrorMessage).toHaveText('Email Address already exist!');
    await expect(loginPage.signupEmailInput).toHaveValue(fixtureEmail);

    // 3. Clean up: log in with the fixture account's original credentials (email from the setup
    // step, its password) and navigate to /delete_account.
    await loginPage.loginWithCredentials(fixtureEmail, fixturePassword);
    await expect(page).toHaveURL('/');
    await expect(loginPage.loggedInAsText).toContainText(`Logged in as ${fixtureName}`);
    await loginPage.goto('/delete_account');
    await expect(signupPage.accountDeletedHeading).toBeVisible();
  });
});
