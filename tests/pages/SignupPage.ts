import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import type { LoginPage } from './LoginPage';

/** Title radio options for the Account Information form. */
export type AccountTitle = 'Mr.' | 'Mrs.';

/**
 * Generates a unique test-user identity (timestamp + random suffix) for an account
 * fixture. The live public site has no test-only reset/seed API, so every Account/Auth
 * test that creates a real account must use a unique email per run — this keeps tests
 * independent, re-runnable, and safe under concurrent test workers.
 */
export function generateTestUser(label = 'Test User'): { name: string; email: string; password: string } {
  const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const emailPrefix = label.toLowerCase().replace(/\s+/g, '.');
  return {
    name: `${label} ${uniqueSuffix}`,
    email: `${emailPrefix}.${uniqueSuffix}@example.com`,
    password: 'TestPass123!',
  };
}

/**
 * Options accepted by `SignupPage.fillAccountInformation`. Only `password` is mandatory;
 * every other field falls back to a sensible test default so callers only need to
 * specify the fields that matter to their scenario (e.g. omitting one to test native
 * required-field validation, by passing an explicit empty string for that field).
 */
export interface AccountInformationOptions {
  title?: AccountTitle;
  password: string;
  day?: string;
  month?: string;
  year?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address?: string;
  address2?: string;
  country?: string;
  state?: string;
  city?: string;
  zipcode?: string;
  mobileNumber?: string;
}

/**
 * Page object for the AutomationExercise '/signup' Account Information form, plus the
 * post-submit '/account_created' page and the structurally-identical '/delete_account'
 * confirmation page (both share the same "Continue" link template).
 * Extends BasePage to reuse the shared header/nav locators.
 */
export class SignupPage extends BasePage {
  readonly accountInformationHeading: Locator;

  readonly titleMrRadio: Locator;
  readonly titleMrsRadio: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly daySelect: Locator;
  readonly monthSelect: Locator;
  readonly yearSelect: Locator;
  readonly newsletterCheckbox: Locator;
  readonly specialOffersCheckbox: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly companyInput: Locator;
  readonly addressInput: Locator;
  readonly address2Input: Locator;
  readonly countrySelect: Locator;
  readonly stateInput: Locator;
  readonly cityInput: Locator;
  readonly zipcodeInput: Locator;
  readonly mobileNumberInput: Locator;
  readonly createAccountButton: Locator;

  // '/account_created' and '/delete_account' confirmation pages
  readonly accountCreatedHeading: Locator;
  readonly accountDeletedHeading: Locator;
  // Paired with `accountDeletedHeading` on '/delete_account' — hoisted here once the
  // identical raw `page.getByText('Your account has been permanently deleted!')` locator
  // turned up duplicated verbatim across every Checkout/Orders spec file that deletes its
  // disposable account (checkout-happy-path, checkout-login-gate, checkout-payment-validation,
  // checkout-multi-item-total).
  readonly accountDeletedConfirmationText: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);

    this.accountInformationHeading = page.getByRole('heading', { name: 'Enter Account Information' });

    this.titleMrRadio = page.locator('#id_gender1');
    this.titleMrsRadio = page.locator('#id_gender2');
    this.nameInput = page.locator('[data-qa="name"]');
    this.emailInput = page.locator('[data-qa="email"]');
    this.passwordInput = page.locator('[data-qa="password"]');
    this.daySelect = page.locator('[data-qa="days"]');
    this.monthSelect = page.locator('[data-qa="months"]');
    this.yearSelect = page.locator('[data-qa="years"]');
    this.newsletterCheckbox = page.locator('#newsletter');
    this.specialOffersCheckbox = page.locator('#optin');
    this.firstNameInput = page.locator('[data-qa="first_name"]');
    this.lastNameInput = page.locator('[data-qa="last_name"]');
    this.companyInput = page.locator('[data-qa="company"]');
    this.addressInput = page.locator('[data-qa="address"]');
    this.address2Input = page.locator('[data-qa="address2"]');
    this.countrySelect = page.locator('[data-qa="country"]');
    this.stateInput = page.locator('[data-qa="state"]');
    this.cityInput = page.locator('[data-qa="city"]');
    this.zipcodeInput = page.locator('[data-qa="zipcode"]');
    this.mobileNumberInput = page.locator('[data-qa="mobile_number"]');
    this.createAccountButton = page.locator('[data-qa="create-account"]');

    this.accountCreatedHeading = page.getByRole('heading', { name: 'Account Created!' });
    this.accountDeletedHeading = page.getByRole('heading', { name: 'Account Deleted!' });
    this.accountDeletedConfirmationText = page.getByText('Your account has been permanently deleted!');
    this.continueButton = page.getByRole('link', { name: 'Continue' });
  }

  /**
   * Fill every field of the Account Information form. Only `password` is required;
   * all other fields fall back to a sensible default test value when omitted. Pass an
   * explicit empty string for a field (e.g. `firstName: ''`) to intentionally leave it
   * blank, such as when testing native required-field validation.
   */
  async fillAccountInformation(info: AccountInformationOptions) {
    const title = info.title ?? 'Mr.';
    await (title === 'Mr.' ? this.titleMrRadio : this.titleMrsRadio).check();

    await this.passwordInput.fill(info.password);

    await this.daySelect.selectOption(info.day ?? '10');
    await this.monthSelect.selectOption(info.month ?? 'May');
    await this.yearSelect.selectOption(info.year ?? '1990');

    await this.firstNameInput.fill(info.firstName ?? 'Test');
    await this.lastNameInput.fill(info.lastName ?? 'User');
    if (info.company) await this.companyInput.fill(info.company);
    await this.addressInput.fill(info.address ?? '123 Test Street');
    if (info.address2) await this.address2Input.fill(info.address2);
    await this.countrySelect.selectOption(info.country ?? 'United States');
    await this.stateInput.fill(info.state ?? 'California');
    await this.cityInput.fill(info.city ?? 'San Francisco');
    await this.zipcodeInput.fill(info.zipcode ?? '94107');
    await this.mobileNumberInput.fill(info.mobileNumber ?? '1234567890');
  }

  /** Click the "Create Account" button to submit the Account Information form. */
  async submit() {
    await this.createAccountButton.click();
  }

  /**
   * Full fixture-account registration flow: New User Signup -> Account Information ->
   * Account Created -> Continue, landing logged-in on '/'. For tests that just need a
   * logged-in account as a starting point rather than exercising the registration flow
   * itself step-by-step (see tests/account/register.spec.ts's first scenario for that).
   */
  async registerAndLogin(loginPage: LoginPage, name: string, email: string, password: string) {
    await loginPage.gotoLogin();
    await loginPage.startSignup(name, email);
    await this.fillAccountInformation({ password });
    await this.submit();
    await this.continueButton.click();
  }
}
