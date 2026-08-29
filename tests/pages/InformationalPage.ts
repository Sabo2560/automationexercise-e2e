import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for AutomationExercise's two static documentation pages, '/test_cases' and
 * '/api_list'. Confirmed live: both pages render from the literal same Bootstrap-accordion
 * template (identical '.panel-heading > a[data-toggle="collapse"]' / '#collapseN' panel
 * structure, identical "Feedback for Us" section) -- differing only in heading text, intro
 * sentence, and the number of numbered items (26 vs 14). One shared, parameterized class
 * covers both, mirroring ProductsPage.ts's precedent of one class covering both '/products'
 * and '/brand_products/{Brand}'.
 * Extends BasePage to reuse its 'testCasesNavLink'/'apiTestingNavLink' header locators.
 *
 * KNOWN QUIRK (confirmed live, deviates from the original informational.plan.md's stated
 * assumption): the accordion header '<a data-toggle="collapse">' elements never carry a
 * 'collapsed' class themselves -- their 'class' attribute is always null/empty on both pages.
 * The collapsed/expanded state instead lives entirely on the corresponding '#collapseN' panel
 * <div>, whose 'class' attribute toggles between 'panel-collapse collapse' (closed) and
 * 'panel-collapse in' (open), matching its computed 'display: none'/'block'.
 * isAccordionItemCollapsed() below reads the panel's class rather than the link's.
 */
export class InformationalPage extends BasePage {
  // Scoped to the '<section id="form">' main content container: both pages also render an
  // unrelated third-party ad widget ("Discover more" articles) that happens to include its
  // own level-2 heading. Confirmed live that ad content sits in a separate frame invisible to
  // main-document queries, but scoping explicitly here keeps this locator provably unambiguous
  // regardless of that ad widget's implementation.
  private readonly mainContent: Locator;

  readonly pageHeading: Locator;
  readonly introText: Locator;
  /** All collapsible accordion header links on the page: every numbered item PLUS one trailing "Feedback for Us" link. */
  readonly accordionLinks: Locator;
  readonly feedbackHeadingLink: Locator;
  readonly feedbackEmailLink: Locator;

  constructor(page: Page) {
    super(page);

    this.mainContent = page.locator('#form');
    this.pageHeading = this.mainContent.getByRole('heading', { level: 2 });
    this.introText = this.mainContent.getByRole('heading', { level: 5 });
    this.accordionLinks = page.locator('a[data-toggle="collapse"]');
    this.feedbackHeadingLink = page.getByRole('link', { name: 'Feedback for Us' });
    this.feedbackEmailLink = page.getByRole('link', { name: 'feedback@automationexercise.com' });
  }

  /** Navigate to '/test_cases' (via the header's Test Cases nav link) and wait for its heading to render. */
  async gotoTestCases() {
    await this.testCasesNavLink.click();
    await this.pageHeading.waitFor({ state: 'visible' });
  }

  /** Navigate to '/api_list' (via the header's API Testing nav link) and wait for its heading to render. */
  async gotoApiList() {
    await this.apiTestingNavLink.click();
    await this.pageHeading.waitFor({ state: 'visible' });
  }

  /**
   * Resolve the '#collapseN' panel Locator for a given accordion header link, by reading the
   * link's own 'href' attribute (e.g. '#collapse7') -- without clicking it. Used internally by
   * expandAccordionItem()/isAccordionItemCollapsed(), and directly by tests that need to
   * inspect a panel's default (unexpanded) state without toggling it open.
   */
  async accordionPanelFor(linkName: string | RegExp): Promise<Locator> {
    const href = await this.page.getByRole('link', { name: linkName }).getAttribute('href');
    return this.page.locator(href!);
  }

  /**
   * Click a given accordion header link and wait for its Bootstrap 'collapse' transition to
   * settle, then return the corresponding panel Locator so the caller can assert on its
   * (now-toggled) visibility/text content. Calling this again on the SAME link toggles it back
   * closed (confirmed live: a plain per-item toggle, not a one-shot reveal) -- this method does
   * not assume the toggle direction, it only waits for the open/close animation to finish.
   */
  async expandAccordionItem(linkName: string | RegExp): Promise<Locator> {
    const link = this.page.getByRole('link', { name: linkName });
    const href = await link.getAttribute('href');
    const panel = this.page.locator(href!);
    await link.click();
    // Bootstrap's collapse plugin adds a transient 'collapsing' class while the panel
    // animates open/closed; wait for it to clear so the panel's post-toggle state is fully
    // settled (whether that means now-visible or now-hidden) before returning.
    await this.page.waitForFunction(
      (selector) => !document.querySelector(selector)?.classList.contains('collapsing'),
      href,
    );
    return panel;
  }

  /**
   * Whether a given accordion item is currently collapsed, read from its own '#collapseN'
   * panel's 'class' attribute (NOT the link's -- see the class-level doc comment above).
   */
  async isAccordionItemCollapsed(linkName: string | RegExp): Promise<boolean> {
    const panel = await this.accordionPanelFor(linkName);
    const panelClass = await panel.getAttribute('class');
    return !panelClass?.includes('in');
  }
}
