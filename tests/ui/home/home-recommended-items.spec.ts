// spec: specs/home.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { CartPage } from '../../pages/CartPage';

test.describe('Recommended Items (TC22 audit gap)', () => {
  test('Adding a product from the "recommended items" section adds it to the cart correctly', async ({ page }) => {
    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);

    // 1. Navigate to the home page (fresh/blank browser state, no prior cart items) and scroll
    // to the 'recommended items' section.
    await homePage.gotoHome();
    await homePage.recommendedItemsHeading.scrollIntoViewIfNeeded();

    await expect(homePage.recommendedItemsSection).toBeVisible();

    // The section shares the '.product-image-wrapper' card markup with the main Features
    // Items grid (confirmed live). Scope a given product's card by its 'Add to cart' control
    // so price/name assertions can never accidentally match the other, currently-inactive group.
    const recommendedItemCard = (productId: number) =>
      homePage.recommendedItemsSection.locator('.product-image-wrapper').filter({
        has: page.locator(`a.add-to-cart[data-product-id="${productId}"]`),
      });

    // Confirmed live: only one of the carousel's two fixed 3-product groups is rendered/visible
    // at a time, and which one is active on a fresh page load is not deterministic. Assert
    // whichever group is currently active shows its known, confirmed values.
    if (await homePage.recommendedItemAddToCart(1).isVisible()) {
      await expect(recommendedItemCard(1).locator('.productinfo h2')).toHaveText('Rs. 500');
      await expect(recommendedItemCard(1).locator('.productinfo p')).toHaveText('Blue Top');
      await expect(recommendedItemCard(2).locator('.productinfo h2')).toHaveText('Rs. 400');
      await expect(recommendedItemCard(2).locator('.productinfo p')).toHaveText('Men Tshirt');
      // Confirmed live markup quirk unique to this widget: product id 3's price heading and
      // name paragraph both literally read 'Rs. 1000'.
      await expect(recommendedItemCard(3).locator('.productinfo h2')).toHaveText('Rs. 1000');
      await expect(recommendedItemCard(3).locator('.productinfo p')).toHaveText('Rs. 1000');
    } else {
      await expect(recommendedItemCard(4).locator('.productinfo h2')).toHaveText('Rs. 1500');
      await expect(recommendedItemCard(4).locator('.productinfo p')).toHaveText('Stylish Dress');
      await expect(recommendedItemCard(5).locator('.productinfo h2')).toHaveText('Rs. 600');
      await expect(recommendedItemCard(5).locator('.productinfo p')).toHaveText('Winter Top');
      await expect(recommendedItemCard(6).locator('.productinfo h2')).toHaveText('Rs. 400');
      await expect(recommendedItemCard(6).locator('.productinfo p')).toHaveText('Summer White Top');
    }
    // Confirmed live (verification run): the carousel keeps BOTH 3-product groups' markup
    // in the DOM at all times (Bootstrap carousel '.item'/'.item.active' pattern) — only
    // one group's cards are actually displayed. A plain '.toHaveCount(3)' against the raw
    // 'a.add-to-cart' locator therefore matches all 6 (3 per group) regardless of which is
    // active; scope to ':visible' to assert only the currently-displayed group's count.
    await expect(homePage.recommendedItemsSection.locator('a.add-to-cart:visible')).toHaveCount(3);

    // 2. Determine which group is currently active/visible. If the 'Winter Top' card is not
    // currently visible, click the carousel's nav-arrow control exactly once.
    if (!(await homePage.recommendedItemAddToCart(5).isVisible())) {
      await homePage.recommendedItemsCarouselNavArrow.click();
    }

    const winterTopCard = recommendedItemCard(5);
    await expect(winterTopCard.locator('.productinfo h2')).toHaveText('Rs. 600');
    await expect(winterTopCard.locator('.productinfo p')).toHaveText('Winter Top');
    await expect(homePage.recommendedItemAddToCart(5)).toBeVisible();

    // 3. Click the 'Add to cart' control on the now-visible 'Winter Top' card.
    await homePage.recommendedItemAddToCart(5).click();

    await expect(homePage.cartModal).toBeVisible();
    await expect(homePage.cartModalAddedHeading).toBeVisible();
    await expect(homePage.cartModalMessage).toBeVisible();
    await expect(homePage.viewCartModalLink).toBeVisible();
    await expect(homePage.continueShoppingButton).toBeVisible();

    // 4. Click the modal's 'View Cart' link.
    await homePage.viewCartModalLink.click();

    await expect(page).toHaveURL(/\/view_cart$/);
    await expect(cartPage.cartTable).toBeVisible();
    expect(await cartPage.getRowCount()).toBe(1);
    await expect(cartPage.row(5)).toBeVisible();
    await expect(cartPage.rowNameLink(5)).toHaveText('Winter Top');
    await expect(cartPage.rowNameLink(5)).toHaveAttribute('href', '/product_details/5');
    await expect(cartPage.rowCategory(5)).toHaveText('Women > Tops');
    await expect(cartPage.rowUnitPrice(5)).toHaveText('Rs. 600');
    await expect(cartPage.rowQuantityControl(5)).toHaveText('1');
    await expect(cartPage.rowLineTotal(5)).toHaveText('Rs. 600');
  });
});
