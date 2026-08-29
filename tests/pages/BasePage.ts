import { type Page, type Locator } from '@playwright/test';

/**
 * BasePage holds helpers and locators shared across all AutomationExercise page objects:
 * navigation, the header nav bar, the footer newsletter subscription widget, and the
 * scroll-to-top control. Concrete page objects (HomePage, ProductsPage, etc.) should
 * extend this class instead of duplicating this logic.
 */
export class BasePage {
  readonly page: Page;

  // Header / primary nav (scoped to the <header> banner landmark)
  readonly header: Locator;
  readonly homeNavLink: Locator;
  readonly productsNavLink: Locator;
  readonly cartNavLink: Locator;
  readonly signupLoginNavLink: Locator;
  readonly testCasesNavLink: Locator;
  readonly apiTestingNavLink: Locator;
  readonly videoTutorialsNavLink: Locator;
  readonly contactUsNavLink: Locator;

  // Header / logged-in state (only present once a user is authenticated)
  readonly logoutNavLink: Locator;
  readonly deleteAccountNavLink: Locator;
  readonly loggedInAsText: Locator;

  // Footer / newsletter subscription
  readonly footer: Locator;
  readonly subscribeEmailInput: Locator;
  readonly subscribeButton: Locator;
  readonly subscribeSuccessAlert: Locator;

  // Scroll-to-top control
  readonly scrollToTopButton: Locator;

  // Guards against re-registering the ad-blocking route handler on every goto() call
  // within the same page (see blockAdNetworks() below).
  private adNetworksBlocked = false;

  constructor(page: Page) {
    this.page = page;

    this.header = page.getByRole('banner');
    this.homeNavLink = this.header.getByRole('link', { name: 'Home' });
    this.productsNavLink = this.header.getByRole('link', { name: 'Products' });
    this.cartNavLink = this.header.getByRole('link', { name: 'Cart' });
    this.signupLoginNavLink = this.header.getByRole('link', { name: 'Signup / Login' });
    this.testCasesNavLink = this.header.getByRole('link', { name: 'Test Cases' });
    this.apiTestingNavLink = this.header.getByRole('link', { name: 'API Testing' });
    this.videoTutorialsNavLink = this.header.getByRole('link', { name: 'Video Tutorials' });
    this.contactUsNavLink = this.header.getByRole('link', { name: 'Contact us' });

    this.logoutNavLink = this.header.getByRole('link', { name: 'Logout' });
    this.deleteAccountNavLink = this.header.getByRole('link', { name: 'Delete Account' });
    this.loggedInAsText = this.header.getByText('Logged in as');

    this.footer = page.locator('#footer');
    this.subscribeEmailInput = page.locator('#susbscribe_email');
    this.subscribeButton = page.locator('#subscribe');
    this.subscribeSuccessAlert = page.locator('.alert-success');

    this.scrollToTopButton = page.locator('#scrollUp');
  }

  /** Navigate to a path relative to the configured baseURL. */
  async goto(path: string) {
    await this.blockAdNetworks();
    await this.page.goto(path);
  }

  /**
   * Block third-party ad-network requests (Google Ads/"vignette" interstitial scripts from
   * googlesyndication/googletagservices/doubleclick). Confirmed live (Product Catalog & Search
   * chunk): on webkit specifically, this ad script installs a page-wide click listener that
   * hijacks the very next click anywhere on the page, rewriting the URL to "#google_vignette"
   * instead of letting the actually-clicked element's own handler navigate — reproducible across
   * more than one spec file (product listing "View Product" links, brand sidebar links), not an
   * actionability/overlap issue fixable with force-click. Aborting the ad script's own requests
   * keeps it from ever attaching that hijacking listener. This only removes third-party ad
   * interference with the live public site under test; it does not alter any behavior of the
   * app under test. Guarded so repeated goto() calls within the same test don't re-register the
   * route handler.
   */
  private async blockAdNetworks() {
    if (this.adNetworksBlocked) return;
    this.adNetworksBlocked = true;
    await this.page.route(/google(syndication|tagservices|ads)|doubleclick\.net/, (route) => route.abort());
  }

  /** Generic load wait other page objects can opt into after a navigation. */
  async waitForLoad() {
    await this.page.waitForLoadState('load');
  }

  /** Fill the footer newsletter email input and submit it. */
  async subscribe(email: string) {
    await this.subscribeEmailInput.fill(email);
    await this.subscribeButton.click();
  }

  /** Scroll to the bottom of the page (used to reveal the scroll-to-top button). */
  async scrollToBottom() {
    await this.page.mouse.wheel(0, 20000);
  }

  /**
   * Generic attribute getter, primarily used to read a nav link's `href` without clicking
   * it (e.g. the external Video Tutorials link, which must never be followed).
   */
  async getHref(link: Locator): Promise<string | null> {
    return link.getAttribute('href');
  }

  /**
   * Click a nav item and wait for the resulting URL to match `expectedUrlPattern`. Centralizes
   * the "click a nav link, then wait for navigation" pattern shared by every internal-link and
   * cross-page nav-presence check in the navigation contract suite, instead of duplicating
   * `Promise.all([page.waitForURL(...), link.click()])` across each spec file.
   */
  async clickNavAndExpectUrl(link: Locator, expectedUrlPattern: RegExp) {
    await Promise.all([this.page.waitForURL(expectedUrlPattern), link.click()]);
  }
}
