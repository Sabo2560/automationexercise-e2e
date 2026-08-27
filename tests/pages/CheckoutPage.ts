import { type Page, type Locator, type Response } from '@playwright/test';
import { BasePage } from './BasePage';
import type { CartPage } from './CartPage';
import type { LoginPage } from './LoginPage';
import type { SignupPage, AccountInformationOptions } from './SignupPage';

/** Options accepted by `CheckoutPage.fillPaymentDetails`. */
export interface PaymentDetails {
  nameOnCard: string;
  cardNumber: string;
  cvc: string;
  expiryMonth: string;
  expiryYear: string;
}

/**
 * Page object for the AutomationExercise checkout flow: '/checkout' (address confirmation
 * + order review), '/payment' (mock payment form), and '/payment_done/{id}' (order
 * confirmation + invoice download). Extends BasePage to reuse the shared header/nav
 * locators. Composes CartPage/LoginPage/SignupPage rather than redeclaring their own
 * locators (e.g. the login-gate modal, the New User Signup mini-form, the Account
 * Information form and its Delete Account cleanup pattern).
 */
export class CheckoutPage extends BasePage {
  // '/checkout' — Address Details
  // Confirmed live: the ONLY `data-qa` attribute anywhere on '/checkout' is
  // `data-qa="checkout-info"` on the wrapping `div.checkout-information` — the review
  // table, comment box, and Place Order link all carry no `data-qa`.
  readonly addressDetailsHeading: Locator;
  readonly deliveryAddress: Locator;
  readonly billingAddress: Locator;

  // '/checkout' — Review Your Order
  readonly reviewOrderHeading: Locator;
  readonly orderReviewTable: Locator;
  readonly totalAmountRow: Locator;
  readonly totalAmountValue: Locator;
  readonly commentTextarea: Locator;
  // Disambiguated from CartPage.proceedToCheckoutButton (also `a.check_out`) by href;
  // the two never coexist on the same page.
  readonly placeOrderButton: Locator;

  // '/payment' — every field here carries a `data-qa` attribute (unlike '/checkout').
  readonly paymentHeading: Locator;
  readonly nameOnCardInput: Locator;
  readonly cardNumberInput: Locator;
  readonly cvcInput: Locator;
  readonly expiryMonthInput: Locator;
  readonly expiryYearInput: Locator;
  readonly payButton: Locator;

  // '/payment_done/{id}' — order confirmation
  readonly orderPlacedHeading: Locator;
  readonly orderConfirmationMessage: Locator;
  readonly downloadInvoiceLink: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);

    this.addressDetailsHeading = page.getByRole('heading', { name: 'Address Details' });
    this.deliveryAddress = page.locator('#address_delivery');
    this.billingAddress = page.locator('#address_invoice');

    this.reviewOrderHeading = page.getByRole('heading', { name: 'Review Your Order' });
    this.orderReviewTable = page.locator('#cart_info table');
    this.totalAmountRow = this.orderReviewTable.locator('tr', {
      has: page.getByRole('heading', { name: 'Total Amount' }),
    });
    this.totalAmountValue = this.totalAmountRow.locator('p');
    this.commentTextarea = page.locator('textarea[name="message"]');
    this.placeOrderButton = page.locator('a.check_out[href="/payment"]');

    this.paymentHeading = page.getByRole('heading', { name: 'Payment' });
    this.nameOnCardInput = page.locator('[data-qa="name-on-card"]');
    this.cardNumberInput = page.locator('[data-qa="card-number"]');
    this.cvcInput = page.locator('[data-qa="cvc"]');
    this.expiryMonthInput = page.locator('[data-qa="expiry-month"]');
    this.expiryYearInput = page.locator('[data-qa="expiry-year"]');
    this.payButton = page.locator('[data-qa="pay-button"]');

    this.orderPlacedHeading = page.locator('[data-qa="order-placed"]');
    this.orderConfirmationMessage = page.getByText('Congratulations! Your order has been confirmed!', {
      exact: true,
    });
    this.downloadInvoiceLink = page.locator('a[href^="/download_invoice"]');
    this.continueButton = page.locator('[data-qa="continue-button"]');
  }

  /**
   * Already-logged-in path: click CartPage's "Proceed To Checkout" from '/view_cart' and
   * wait for '/checkout' to render (no modal appears in this case, contrast with
   * `registerViaCheckoutGate` below).
   *
   * Working hypothesis (chromium-specific failures observed, exact cause not independently
   * re-confirmed live): the click can occasionally land while a transient overlay (e.g. an
   * ad slot reflowing the page) is covering the button, so the click is swallowed and
   * '/checkout' never renders. Scroll the button fully into view first, then allow a
   * single re-click — only if we're demonstrably still on '/view_cart' — before falling
   * through to the full-timeout wait that surfaces a genuine failure.
   */
  async proceedToCheckoutFromCart(cartPage: CartPage) {
    await cartPage.proceedToCheckoutButton.scrollIntoViewIfNeeded();
    await cartPage.proceedToCheckoutButton.click();
    try {
      await this.addressDetailsHeading.waitFor({ state: 'visible', timeout: 5000 });
      return;
    } catch {
      // Fall through to the retry below.
    }
    if (!/\/checkout$/.test(this.page.url())) {
      await cartPage.proceedToCheckoutButton.click();
    }
    await this.addressDetailsHeading.waitFor({ state: 'visible' });
  }

  /**
   * Composed register-while-checkout helper (Test Case 14/23): open the login-gate modal,
   * follow its "Register / Login" link to '/login', fill the New User Signup mini-form,
   * then the full Account Information form, and click Continue. Deliberately does NOT call
   * `SignupPage.registerAndLogin()` as-is, since that helper starts with its own fresh
   * `loginPage.gotoLogin()` navigation rather than arriving at '/login' via the modal's link.
   */
  async registerViaCheckoutGate(
    cartPage: CartPage,
    loginPage: LoginPage,
    signupPage: SignupPage,
    name: string,
    email: string,
    password: string,
    accountInfo?: Omit<AccountInformationOptions, 'password'>,
  ) {
    await cartPage.clickProceedToCheckout();
    await cartPage.checkoutModalLoginLink.click();
    await this.page.waitForURL('**/login');
    await loginPage.startSignup(name, email);
    await signupPage.fillAccountInformation({ password, ...accountInfo });
    await signupPage.submit();
    await signupPage.continueButton.click();
  }

  /**
   * Return a given address section's ('deliveryAddress'/'billingAddress') visible lines,
   * normalized (trimmed, blank/heading lines dropped), newline-joined — for comparing
   * against the values submitted for the currently logged-in account.
   */
  async getAddressText(section: Locator): Promise<string> {
    const items = await section.locator('li').allInnerTexts();
    return items
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.toLowerCase().startsWith('your '))
      .join('\n');
  }

  /** Fill the "add a comment about your order" textarea. */
  async fillComment(text: string) {
    await this.commentTextarea.fill(text);
  }

  /** Click "Place Order" and wait for the '/payment' Payment heading to render. */
  async clickPlaceOrder() {
    await this.placeOrderButton.click();
    await this.paymentHeading.waitFor({ state: 'visible' });
  }

  /** Fill all 5 payment fields with the given (obviously-fake, test-only) card data. */
  async fillPaymentDetails({ nameOnCard, cardNumber, cvc, expiryMonth, expiryYear }: PaymentDetails) {
    await this.nameOnCardInput.fill(nameOnCard);
    await this.cardNumberInput.fill(cardNumber);
    await this.cvcInput.fill(cvc);
    await this.expiryMonthInput.fill(expiryMonth);
    await this.expiryYearInput.fill(expiryYear);
  }

  /**
   * Click "Pay and Confirm Order". Callers that need to assert on the resulting
   * 'POST /payment' network request/response or the destination URL should set up that
   * listening/waiting around this call themselves.
   */
  async submitPayment() {
    await this.payButton.click();
  }

  /** Parse the trailing order id integer from a '/payment_done/{id}' URL. Never hardcoded. */
  getOrderIdFromUrl(): number {
    const match = this.page.url().match(/\/payment_done\/(\d+)/);
    if (!match) {
      throw new Error(`Expected a '/payment_done/{id}' URL, got: ${this.page.url()}`);
    }
    return Number(match[1]);
  }

  /**
   * Click "Download Invoice" and return the underlying 'GET /download_invoice/{orderId}' network
   * Response — status/headers only, see `fetchInvoiceText` for the body — rather than waiting on
   * Playwright's native 'download' browser event.
   *
   * This deliberately does NOT use `page.waitForEvent('download')`. Confirmed via two real GitHub
   * Actions (Ubuntu) CI runs — with the 'download' wait already raised to a generous 45s timeout —
   * the native download event never fired even once across both attempts (original + retry), while
   * the exact same interaction works locally on Windows/WebKit. This rules out a timing/slowness
   * explanation: it is headless WebKit's Linux build genuinely not firing the browser
   * download-manager event for this interaction, a known gap area rather than something a longer
   * timeout can fix (see specs/test-plan.md's Checkout/Orders section).
   */
  async downloadInvoice(orderId: number): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((res) => new URL(res.url()).pathname === `/download_invoice/${orderId}`),
      this.downloadInvoiceLink.click(),
    ]);
    return response;
  }

  /**
   * Independently re-fetch the same '/download_invoice/{orderId}' endpoint's full text body via
   * `page.request` (an `APIRequestContext` that shares the page's authenticated session cookies),
   * rather than reading the body off the click-triggered Response returned by `downloadInvoice`.
   *
   * Confirmed via this project's own local cross-browser verification: once a response is
   * classified by the browser as a download, its body becomes unreadable via the normal Response
   * object on more than just WebKit — chromium throws immediately ("Response body is not available
   * for a response that was navigated away from"), webkit hangs until the test timeout, and only
   * firefox happened to still expose it. This is a general Playwright/CDP limitation for
   * download-triggering responses, not a single-browser quirk, so status/headers are read from the
   * real UI-triggered response (above) while the body is read from a plain, never-diverted API
   * request against the exact same URL and session — reliable identically on all three browsers.
   */
  async fetchInvoiceText(orderId: number): Promise<string> {
    const response = await this.page.request.get(`/download_invoice/${orderId}`);
    return (await response.text()).trim();
  }
}
