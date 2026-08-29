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
  // Added for scenario 1.7 (TC22 audit gap): the "recommended items" carousel section,
  // its (either-identical) nav-arrow link, and a per-product "Add to cart" helper. This
  // section renders real, interactive product cards using the same '.add-to-cart' /
  // 'data-product-id' mechanism as the main Features Items grid.
  readonly recommendedItemsSection: Locator;
  readonly recommendedItemsCarouselNavArrow: Locator;
  // Site-wide add-to-cart confirmation modal group, mirroring ProductDetailsPage's
  // identical '#cartModal' locators (same DOM id shared across the site). Duplicated
  // here rather than hoisted to BasePage per the plan's note that such a refactor is
  // out of scope for this addendum.
  readonly cartModal: Locator;
  readonly cartModalAddedHeading: Locator;
  readonly cartModalMessage: Locator;
  readonly viewCartModalLink: Locator;
  readonly continueShoppingButton: Locator;
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
    this.recommendedItemsSection = page.locator('.recommended_items');
    // Confirmed live: two identical nav-arrow links exist scoped inside the section;
    // clicking either one toggles between the carousel's two fixed slide-groups.
    this.recommendedItemsCarouselNavArrow = this.recommendedItemsSection
      .locator('a[href="#recommended-item-carousel"]')
      .first();

    this.cartModal = page.locator('#cartModal');
    this.cartModalAddedHeading = this.cartModal.getByRole('heading', { name: 'Added!' });
    this.cartModalMessage = this.cartModal.getByText('Your product has been added to cart.');
    this.viewCartModalLink = this.cartModal.locator('a[href="/view_cart"]');
    this.continueShoppingButton = this.cartModal.getByRole('button', { name: 'Continue Shopping' });

    this.subscriptionHeading = this.footer.getByRole('heading', { name: 'Subscription' });
    this.footerCopyright = this.footer.getByText('All rights reserved');
  }

  /** Navigate to the home page and wait for it to be fully loaded. */
  async gotoHome() {
    await this.goto('/');
    await this.featuresItemsHeading.waitFor({ state: 'visible' });
  }

  /**
   * A given product's "Add to cart" control within the "recommended items" carousel
   * section specifically (scoped so it can never accidentally match the main Features
   * Items grid's identically-classed controls for the same product id).
   */
  recommendedItemAddToCart(productId: number): Locator {
    return this.recommendedItemsSection.locator(`a.add-to-cart[data-product-id="${productId}"]`);
  }
}
