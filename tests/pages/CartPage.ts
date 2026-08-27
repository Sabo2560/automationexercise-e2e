import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the AutomationExercise '/view_cart' page, which renders exactly one of
 * two mutually-exclusive states (the cart table or the empty-cart message), plus the
 * in-page '#checkoutModal' login-gate dialog opened by "Proceed To Checkout" (no
 * navigation occurs when it opens). Extends BasePage to reuse the shared header/nav
 * locators.
 *
 * KNOWN QUIRK: this page's <title> always reads "Automation Exercise - Checkout", whether
 * the cart is empty, populated, or the checkout modal is open — never use page title to
 * distinguish state here; use the locators below instead.
 */
export class CartPage extends BasePage {
  readonly cartTable: Locator;
  readonly emptyCartMessage: Locator;
  readonly emptyCartProductsLink: Locator;
  /** All '<tr id="product-{id}">' rows currently rendered in the cart table. */
  readonly cartRows: Locator;

  readonly proceedToCheckoutButton: Locator;

  readonly checkoutModal: Locator;
  readonly checkoutModalHeading: Locator;
  readonly checkoutModalMessage: Locator;
  readonly checkoutModalLoginLink: Locator;
  readonly checkoutModalContinueButton: Locator;

  constructor(page: Page) {
    super(page);

    this.cartTable = page.locator('#cart_info_table');
    this.emptyCartMessage = page.locator('#empty_cart');
    this.emptyCartProductsLink = this.emptyCartMessage.locator('a[href="/products"]');
    this.cartRows = this.cartTable.locator('tbody tr');

    this.proceedToCheckoutButton = page.locator('a.check_out');

    this.checkoutModal = page.locator('#checkoutModal');
    this.checkoutModalHeading = this.checkoutModal.getByRole('heading', { name: 'Checkout' });
    this.checkoutModalMessage = this.checkoutModal.getByText('Register / Login account to proceed on checkout.');
    this.checkoutModalLoginLink = this.checkoutModal.locator('a[href="/login"]');
    this.checkoutModalContinueButton = this.checkoutModal.locator('button.close-checkout-modal');
  }

  /**
   * Navigate to '/view_cart' and wait for the page to settle into one of its two
   * mutually-exclusive states (the cart table or the empty-cart message).
   */
  async gotoCart() {
    await this.goto('/view_cart');
    await Promise.race([
      this.cartTable.waitFor({ state: 'visible' }),
      this.emptyCartMessage.waitFor({ state: 'visible' }),
    ]);
  }

  /** Number of line-item rows currently rendered in the cart table. */
  async getRowCount(): Promise<number> {
    return this.cartRows.count();
  }

  /** A given product's row, scoped by its literal '#product-{id}' element id. */
  row(productId: number): Locator {
    return this.page.locator(`#product-${productId}`);
  }

  /** A row's product name heading/link (text + href to '/product_details/{id}'). */
  rowNameLink(productId: number): Locator {
    return this.row(productId).locator('.cart_description h4 a');
  }

  /** A row's category text (e.g. "Women > Tops"). */
  rowCategory(productId: number): Locator {
    return this.row(productId).locator('.cart_description p');
  }

  /** A row's unit price (e.g. "Rs. 500"). */
  rowUnitPrice(productId: number): Locator {
    return this.row(productId).locator('.cart_price p');
  }

  /** A row's quantity control — a static '<button class="disabled">{n}</button>', not an '<input>'. */
  rowQuantityControl(productId: number): Locator {
    return this.row(productId).locator('.cart_quantity button');
  }

  /** A row's line total (e.g. "Rs. 1000" = unit price x quantity). */
  rowLineTotal(productId: number): Locator {
    return this.row(productId).locator('.cart_total p.cart_total_price');
  }

  /** A row's delete ("X") control, carries a 'data-product-id' attribute matching the row's product id. */
  rowDeleteControl(productId: number): Locator {
    return this.row(productId).locator('.cart_delete a.cart_quantity_delete');
  }

  /** Click a row's delete control and wait for that row to detach from the DOM. */
  async deleteItem(productId: number) {
    await this.rowDeleteControl(productId).click();
    await this.row(productId).waitFor({ state: 'detached' });
  }

  /**
   * Click "Proceed To Checkout" and wait for the login-gate modal to become visible.
   * Working hypothesis (chromium-specific failures observed, exact cause not independently
   * re-confirmed live): the click can occasionally land while a transient overlay (e.g. an
   * ad slot reflowing the page) is covering the button, so the click is swallowed and the
   * modal never opens. Scroll the button fully into view first, then allow a single re-click
   * if the modal hasn't appeared shortly after the first attempt, before falling through to
   * the full-timeout wait that surfaces a genuine failure.
   */
  async clickProceedToCheckout() {
    await this.proceedToCheckoutButton.scrollIntoViewIfNeeded();
    await this.proceedToCheckoutButton.click();
    if (!(await this.isCheckoutModalVisibleWithin(5000))) {
      await this.proceedToCheckoutButton.click();
    }
    await this.checkoutModal.waitFor({ state: 'visible' });
  }

  /** Resolve `true` if the checkout modal becomes visible within `timeout` ms, else `false`. */
  private async isCheckoutModalVisibleWithin(timeout: number): Promise<boolean> {
    try {
      await this.checkoutModal.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /** Click "Continue On Cart" and wait for the checkout modal to become hidden again. */
  async dismissCheckoutModal() {
    await this.checkoutModalContinueButton.click();
    await this.checkoutModal.waitFor({ state: 'hidden' });
  }
}
