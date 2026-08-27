import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the AutomationExercise product listing template. This single template is
 * shared by the default '/products' grid and the brand-filtered '/brand_products/{Brand}'
 * pages (confirmed live: same Category sidebar, Brands sidebar, and product grid markup),
 * so both navigations live on this one Page Object.
 * Extends BasePage to reuse the shared header/nav, footer/subscription, and
 * scroll-to-top locators/helpers.
 */
export class ProductsPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly allProductsHeading: Locator;
  readonly searchedProductsHeading: Locator;

  readonly categorySidebarHeading: Locator;
  // Matched by href rather than accessible name, matching HomePage's convention: the
  // sidebar links carry a leading icon glyph in their accessible name, and a plain
  // "Kids" text/role match would also match the unrelated "Kookie Kids" brand link.
  readonly categoryWomenLink: Locator;
  readonly categoryMenLink: Locator;
  readonly categoryKidsLink: Locator;

  readonly brandsHeading: Locator;
  // The page's h2 reading "Brand -  {Brand} Products" once on a brand page (note: the
  // double space between the hyphen and the brand name is literal, confirmed live).
  readonly brandHeading: Locator;

  /** All product card wrappers in the grid (default listing, search results, or brand listing). */
  readonly productCards: Locator;
  // Scoped to the always-visible ".productinfo" block of the first product card,
  // avoiding the duplicate (hover-only) markup in ".product-overlay" (same pattern as HomePage).
  readonly firstProductCard: Locator;
  readonly firstProductInfo: Locator;
  readonly firstProductPrice: Locator;
  readonly firstProductName: Locator;
  readonly firstProductAddToCart: Locator;
  readonly firstProductViewProduct: Locator;

  constructor(page: Page) {
    super(page);

    this.searchInput = page.locator('#search_product');
    this.searchButton = page.locator('#submit_search');
    this.allProductsHeading = page.getByRole('heading', { name: 'All Products' });
    this.searchedProductsHeading = page.getByRole('heading', { name: 'Searched Products' });

    this.categorySidebarHeading = page.getByRole('heading', { name: 'Category' });
    this.categoryWomenLink = page.locator('a[href="#Women"]');
    this.categoryMenLink = page.locator('a[href="#Men"]');
    this.categoryKidsLink = page.locator('a[href="#Kids"]');

    this.brandsHeading = page.getByRole('heading', { name: 'Brands' });
    this.brandHeading = page.getByRole('heading', { name: /^Brand -\s+.+ Products$/ });

    this.productCards = page.locator('.product-image-wrapper');
    this.firstProductCard = this.productCards.first();
    this.firstProductInfo = this.firstProductCard.locator('.productinfo');
    this.firstProductPrice = this.firstProductInfo.locator('h2');
    this.firstProductName = this.firstProductInfo.locator('p');
    this.firstProductAddToCart = this.firstProductInfo.getByText('Add to cart');
    this.firstProductViewProduct = this.firstProductCard.locator('.choose').getByText('View Product');
  }

  /** Navigate to the default product listing and wait for the "All Products" grid to render. */
  async gotoProducts() {
    await this.goto('/products');
    await this.allProductsHeading.waitFor({ state: 'visible' });
  }

  /** Navigate to a brand-filtered listing (e.g. 'Polo') and wait for its brand heading to render. */
  async gotoBrand(brand: string) {
    await this.goto(`/brand_products/${brand}`);
    await this.brandHeading.waitFor({ state: 'visible' });
  }

  /** A sidebar link to a given brand's listing, e.g. brandLink('Polo') -> a[href="/brand_products/Polo"]. */
  brandLink(brand: string): Locator {
    return this.page.locator(`a[href="/brand_products/${brand}"]`);
  }

  /**
   * The "(N)" product-count badge inside a given brand's sidebar link (e.g.
   * brandProductCountBadge('Polo') reads the "(6)" span next to the Polo link).
   */
  brandProductCountBadge(brand: string): Locator {
    return this.brandLink(brand).locator('span.pull-right');
  }

  /** Read and parse a brand's sidebar product-count badge (e.g. "(6)" -> 6). */
  async getBrandProductCount(brand: string): Promise<number> {
    const text = await this.brandProductCountBadge(brand).textContent();
    return Number(text?.replace(/[()]/g, ''));
  }

  /** Fill the search box and submit it (a full page GET reload to '/products?search={term}'). */
  async search(term: string) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }

  /** Click the Category sidebar's accordion link for the given top-level panel. */
  async expandCategory(category: 'Women' | 'Men' | 'Kids') {
    const link = { Women: this.categoryWomenLink, Men: this.categoryMenLink, Kids: this.categoryKidsLink }[category];
    await link.click();
  }

  /**
   * A Category accordion subcategory link, scoped by the '/category_products/{id}' destination
   * it points to (e.g. categorySubcategoryLink(1) -> the Women > Dress link). These links only
   * become visible once their parent top-level panel (Women/Men/Kids) is expanded.
   */
  categorySubcategoryLink(categoryProductId: number): Locator {
    return this.page.locator(`a[href="/category_products/${categoryProductId}"]`);
  }

  /** A given card's "View Product" link, scoped by the product id it points to. */
  productViewProductLink(productId: number): Locator {
    return this.page.locator(`.product-image-wrapper a[href="/product_details/${productId}"]`);
  }

  /** Number of product cards currently rendered in the grid. */
  async getProductCount(): Promise<number> {
    return this.productCards.count();
  }

  /** All product card names currently rendered in the grid, in DOM order. */
  async getProductNames(): Promise<string[]> {
    return this.productCards.locator('.productinfo p').allTextContents();
  }
}
