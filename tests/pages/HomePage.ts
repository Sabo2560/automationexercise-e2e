import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the AutomationExercise home page ('/').
 * Extends BasePage to reuse the shared header/nav, footer/subscription, and
 * scroll-to-top locators/helpers.
 */
export class HomePage extends BasePage {
  readonly logo: Locator;
  readonly carousel: Locator;
  readonly categorySidebarHeading: Locator;
  readonly categoryWomenLink: Locator;
  readonly categoryMenLink: Locator;
  readonly categoryKidsLink: Locator;
  readonly brandsHeading: Locator;
  readonly brandLinks: Locator;
  readonly featuresItemsHeading: Locator;
  readonly firstProductCard: Locator;
  readonly firstProductInfo: Locator;
  readonly firstProductPrice: Locator;
  readonly firstProductName: Locator;
  readonly firstProductAddToCart: Locator;
  readonly firstProductViewProduct: Locator;
  readonly recommendedItemsHeading: Locator;
  readonly subscriptionHeading: Locator;
  readonly footerCopyright: Locator;

  constructor(page: Page) {
    super(page);

    this.logo = this.header.locator('img[alt="Website for automation practice"]');
    this.carousel = page.locator('#slider-carousel');

    this.categorySidebarHeading = page.getByRole('heading', { name: 'Category' });
    // Matched by href rather than accessible name: the sidebar links carry a leading
    // icon glyph in their accessible name, and a plain "Kids" text/role match would
    // also match the unrelated "Kookie Kids" brand link.
    this.categoryWomenLink = page.locator('a[href="#Women"]');
    this.categoryMenLink = page.locator('a[href="#Men"]');
    this.categoryKidsLink = page.locator('a[href="#Kids"]');

    this.brandsHeading = page.getByRole('heading', { name: 'Brands' });
    this.brandLinks = page.locator('a[href="/brand_products/Polo"]');

    this.featuresItemsHeading = page.getByRole('heading', { name: 'Features Items' });
    // Scoped to the always-visible ".productinfo" block of the first product card,
    // avoiding the duplicate (hover-only) markup in ".product-overlay".
    this.firstProductCard = page.locator('.product-image-wrapper').first();
    this.firstProductInfo = this.firstProductCard.locator('.productinfo');
    this.firstProductPrice = this.firstProductInfo.locator('h2');
    this.firstProductName = this.firstProductInfo.locator('p');
    this.firstProductAddToCart = this.firstProductInfo.getByText('Add to cart');
    this.firstProductViewProduct = this.firstProductCard.locator('.choose').getByText('View Product');

    this.recommendedItemsHeading = page.getByRole('heading', { name: 'recommended items' });

    this.subscriptionHeading = this.footer.getByRole('heading', { name: 'Subscription' });
    this.footerCopyright = this.footer.getByText('All rights reserved');
  }

  /** Navigate to the home page and wait for it to be fully loaded. */
  async gotoHome() {
    await this.goto('/');
    await this.featuresItemsHeading.waitFor({ state: 'visible' });
  }
}
