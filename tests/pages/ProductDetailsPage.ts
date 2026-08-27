import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the AutomationExercise '/product_details/{id}' page: product info
 * (name/category/price/quantity/Add to cart), the in-page '#cartModal' confirmation
 * dialog it opens (no navigation occurs), and the product review submission form.
 * Extends BasePage to reuse the shared header/nav, footer/subscription, and
 * scroll-to-top locators/helpers.
 */
export class ProductDetailsPage extends BasePage {
  readonly productInfo: Locator;
  readonly productNameHeading: Locator;
  // Scoped by text prefix rather than index: '.product-information' renders four
  // sibling <p> tags (Category, Availability, Condition, Brand) with no distinguishing
  // class, so matching on each line's literal prefix is the most resilient selector.
  readonly categoryText: Locator;
  readonly availabilityText: Locator;
  readonly conditionText: Locator;
  readonly brandText: Locator;
  // The price lives in an inner <span> nested inside an outer <span> that also wraps
  // the Quantity label/input/Add to cart button (confirmed live via DOM read), so a
  // plain '.product-information span' would match the outer wrapper first.
  readonly priceText: Locator;
  readonly quantityInput: Locator;
  readonly addToCartButton: Locator;

  readonly cartModal: Locator;
  readonly cartModalAddedHeading: Locator;
  readonly cartModalMessage: Locator;
  readonly viewCartModalLink: Locator;
  readonly continueShoppingButton: Locator;

  readonly reviewForm: Locator;
  readonly reviewNameInput: Locator;
  readonly reviewEmailInput: Locator;
  readonly reviewTextInput: Locator;
  readonly reviewSubmitButton: Locator;
  // Hidden by default (class 'form-row hide'); holds the "Thank you for your review."
  // alert-success block once/if a review submission succeeds.
  readonly reviewSuccessSection: Locator;

  constructor(page: Page) {
    super(page);

    this.productInfo = page.locator('.product-information');
    this.productNameHeading = this.productInfo.locator('h2');
    this.categoryText = this.productInfo.locator('p', { hasText: 'Category:' });
    this.availabilityText = this.productInfo.locator('p', { hasText: 'Availability:' });
    this.conditionText = this.productInfo.locator('p', { hasText: 'Condition:' });
    this.brandText = this.productInfo.locator('p', { hasText: 'Brand:' });
    this.priceText = this.productInfo.locator('span span');
    this.quantityInput = page.locator('#quantity');
    this.addToCartButton = this.productInfo.locator('button.cart');

    this.cartModal = page.locator('#cartModal');
    this.cartModalAddedHeading = this.cartModal.getByRole('heading', { name: 'Added!' });
    this.cartModalMessage = this.cartModal.getByText('Your product has been added to cart.');
    this.viewCartModalLink = this.cartModal.locator('a[href="/view_cart"]');
    this.continueShoppingButton = this.cartModal.getByRole('button', { name: 'Continue Shopping' });

    this.reviewForm = page.locator('#review-form');
    this.reviewNameInput = page.locator('#name');
    this.reviewEmailInput = page.locator('#email');
    this.reviewTextInput = page.locator('#review');
    this.reviewSubmitButton = page.locator('#button-review');
    this.reviewSuccessSection = page.locator('#review-section');
  }

  /** Navigate to a product's detail page and wait for its name heading to render. */
  async gotoProduct(id: number) {
    await this.goto(`/product_details/${id}`);
    await this.productNameHeading.waitFor({ state: 'visible' });
  }

  /** Replace the quantity input's value with the given amount. */
  async setQuantity(n: number) {
    await this.quantityInput.fill(String(n));
  }

  /** Click "Add to cart" and wait for the '#cartModal' confirmation dialog to appear. */
  async addToCart() {
    await this.addToCartButton.click();
    await this.cartModal.waitFor({ state: 'visible' });
  }

  /**
   * Composed setup helper for other chunks (e.g. Cart) that need an item already in the
   * cart before their own scenario starts: navigate to a product, optionally set a custom
   * quantity, add it to cart, then follow the confirmation modal's "View Cart" link to
   * '/view_cart'. Added during the Cart chunk's cleanup pass once this exact three/four-step
   * sequence turned up identically across four separate cart spec files.
   */
  async addToCartAndViewCart(id: number, quantity?: number) {
    await this.gotoProduct(id);
    if (quantity !== undefined) {
      await this.setQuantity(quantity);
    }
    await this.addToCart();
    await this.viewCartModalLink.click();
  }

  /** Fill the review form (name/email/review text) and submit it. */
  async submitReview({ name, email, review }: { name: string; email: string; review: string }) {
    await this.reviewNameInput.fill(name);
    await this.reviewEmailInput.fill(email);
    await this.reviewTextInput.fill(review);
    await this.reviewSubmitButton.click();
  }
}
