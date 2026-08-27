import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the AutomationExercise '/login' page, which hosts two independent
 * plain-HTML-form sections: "Login to your account" and "New User Signup!".
 * Extends BasePage to reuse the shared header/nav locators.
 */
export class LoginPage extends BasePage {
  readonly loginHeading: Locator;
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginButton: Locator;
  // The red-text <p> error rendered inside the login form after a failed attempt
  // (e.g. "Your email or password is incorrect!"). Scoped to the <form> that contains
  // the login email input since the element carries no distinguishing class/data-qa.
  readonly loginErrorMessage: Locator;

  readonly signupHeading: Locator;
  readonly signupNameInput: Locator;
  readonly signupEmailInput: Locator;
  readonly signupButton: Locator;
  // The red-text <p> error rendered inside the New User Signup form when the submitted
  // email already belongs to a registered account (e.g. "Email Address already exist!").
  readonly signupErrorMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.loginHeading = page.getByRole('heading', { name: 'Login to your account' });
    this.loginEmailInput = page.locator('[data-qa="login-email"]');
    this.loginPasswordInput = page.locator('[data-qa="login-password"]');
    this.loginButton = page.locator('[data-qa="login-button"]');
    const loginForm = page.locator('form', { has: this.loginEmailInput });
    this.loginErrorMessage = loginForm.locator('p');

    this.signupHeading = page.getByRole('heading', { name: 'New User Signup!' });
    this.signupNameInput = page.locator('[data-qa="signup-name"]');
    this.signupEmailInput = page.locator('[data-qa="signup-email"]');
    this.signupButton = page.locator('[data-qa="signup-button"]');
    const signupForm = page.locator('form', { has: this.signupNameInput });
    this.signupErrorMessage = signupForm.locator('p');
  }

  /** Navigate to the login page and wait for it to be fully loaded. */
  async gotoLogin() {
    await this.goto('/login');
    await this.loginHeading.waitFor({ state: 'visible' });
  }

  /** Fill the "Login to your account" form and submit it. */
  async loginWithCredentials(email: string, password: string) {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Fill the "New User Signup!" mini-form and click Signup — the natural entry point
   * into the /signup Account Information form (SignupPage).
   */
  async startSignup(name: string, email: string) {
    await this.signupNameInput.fill(name);
    await this.signupEmailInput.fill(email);
    await this.signupButton.click();
  }
}
