# Cart Test Plan

## Application Overview

This plan covers the AutomationExercise Cart chunk: the `/view_cart` page in both its empty state (no items ever added) and its populated state (one or more line items added via the existing Add-to-Cart flow), including per-row display (name/category/price/quantity/line total), the row-level Delete control, and the login-gated "Proceed to Checkout" flow for a NOT-logged-in user. Explicitly OUT OF SCOPE: the `/login` form interaction itself (only the checkout modal's login link destination is confirmed), the `/payment` page, order placement, and invoice download — these belong to a separate Checkout/Orders chunk planned later. No scenario in this plan continues past the login/register prompt into an authenticated checkout.

Page Object plan: a NEW `tests/pages/CartPage.ts`, extending `BasePage` (`tests/pages/BasePage.ts`, already implemented — reuses its header/footer/nav locators, does not redeclare them). For test setup (getting one or more items into the cart before exercising display/removal/checkout scenarios), this plan REUSES the existing `tests/pages/ProductDetailsPage.ts` (`gotoProduct(id)`, `setQuantity(n)`, `addToCart()` which already opens `#cartModal`, and its `viewCartModalLink` to navigate to `/view_cart`) — CartPage itself does NOT reinvent an add-to-cart flow. `tests/pages/ProductsPage.ts` is not needed for this chunk's setup since navigating directly to known `/product_details/{id}` URLs is sufficient and matches the existing Product Catalog chunk's established pattern. For the login-gated checkout scenario, this plan reuses `tests/pages/LoginPage.ts` only to the extent of confirming the checkout modal's "Register / Login" link's href equals `/login` (matching `LoginPage`'s own `gotoLogin()` destination) — it does NOT exercise `LoginPage`'s form fields or `SignupPage` at all, since actually logging in is out of scope for this chunk.

`CartPage.ts` locators/methods needed: `cartTable` (`#cart_info_table`), `emptyCartMessage` (`#empty_cart`, a `<span>` shown in place of the table when the cart has zero items — confirmed via DOM read that it is a sibling of the table within the same `#cart_info` container, not a modal or overlay), `emptyCartProductsLink` (`#empty_cart a[href="/products"]`), `cartRows` (`#cart_info_table tbody tr`, collection), `row(productId)` (helper returning `#product-{productId}`, e.g. `#product-1` — confirmed live this is the row's literal `id` attribute, matching the product's numeric id used elsewhere in the site's URLs), and per-row scoped helpers built from a row locator: `.cart_description h4 a` (product name + link to `/product_details/{id}`), `.cart_description p` (category text, e.g. "Women > Tops"), `.cart_price p` (unit price, e.g. "Rs. 500"), `.cart_quantity button` (the quantity display — confirmed a `<button class="disabled">` NOT an `<input>`), `.cart_total p.cart_total_price` (line total, e.g. "Rs. 1000"), `.cart_delete a.cart_quantity_delete` (the delete/"X" control, carries a `data-product-id` attribute matching the row's product id). Also: `proceedToCheckoutButton` (`a.check_out`, text "Proceed To Checkout" — confirmed this element only renders when the cart has at least one item; it does not exist in the empty-cart DOM), `checkoutModal` (`#checkoutModal`), `checkoutModalHeading` (`heading "Checkout"` scoped to the modal), `checkoutModalMessage` (paragraph "Register / Login account to proceed on checkout." scoped to the modal), `checkoutModalLoginLink` (`#checkoutModal a[href="/login"]`), `checkoutModalContinueButton` (`button.close-checkout-modal`, text "Continue On Cart", scoped to the modal). Methods: `gotoCart()` (navigate `/view_cart`, wait for either `cartTable` or `emptyCartMessage` to be visible — the page renders exactly one of the two, never both), `getRowCount()` (count of `cartRows`), `deleteItem(productId)` (click that row's `.cart_delete a.cart_quantity_delete`, wait for the row locator to detach from the DOM), `clickProceedToCheckout()` (click `proceedToCheckoutButton`, wait for `checkoutModal` to become visible), `dismissCheckoutModal()` (click `checkoutModalContinueButton`, wait for `checkoutModal` to become hidden).

Confirmed technical facts from live exploration (to prevent the generator from guessing):
- KNOWN QUIRK (carried over from the Product Catalog chunk's discovery, not re-verified here but binding for this plan): `/view_cart`'s `<title>` reads "Automation Exercise - Checkout" at ALL times — whether the cart is empty, populated, or the checkout modal is open. Do NOT use page title in any expected-outcome to distinguish "viewing the cart" from "in a checkout state"; use the presence/absence of `#cart_info_table` vs `#empty_cart`, and `#checkoutModal`'s visibility, instead.
- `/view_cart` has NO `data-qa`/`data-testid` attributes anywhere (confirmed via DOM read), consistent with Home/Products/Product Detail. All locators in this plan use id/class/role selectors, matching this project's established convention in `ProductsPage.ts`/`ProductDetailsPage.ts`/`HomePage.ts`.
- Empty state (confirmed by navigating directly to `/view_cart` fresh, with zero prior Add-to-Cart actions in the session): the page shows NO table at all — `#cart_info_table` is absent from the DOM — and instead shows `#empty_cart`, a `<span>` containing the exact text "Cart is empty!" followed by "Click here to buy products.", where "here" is a link with `href="/products"`. No "Proceed To Checkout" control exists on the page in this state (confirmed: `a.check_out` is absent from the empty-cart DOM). Note: an unrelated third-party ad-annotation overlay (`div.google-anno-skip`, labelled "Calculate Shipping Costs") was observed injected into the DOM near this message during exploration — this is NOT a real site feature (it is the same ad-network interference `BasePage.blockAdNetworks()` already exists to suppress); it must not be treated as an actual "Calculate Shipping" feature in any scenario.
- Cart table markup (confirmed live with 1-2 items added via `ProductDetailsPage`): `<table id="cart_info_table" class="table table-condensed">` with a header row (`Item`/`Description`/`Price`/`Quantity`/`Total`/blank) and one `<tr id="product-{id}">` per distinct product. Confirmed exact row structure for product id 1 ("Blue Top", added with quantity 2, unit price "Rs. 500"): `<td class="cart_product">` (image link), `<td class="cart_description"><h4><a href="/product_details/1">Blue Top</a></h4><p>Women &gt; Tops</p></td>`, `<td class="cart_price"><p>Rs. 500</p></td>`, `<td class="cart_quantity"><button class="disabled">2</button></td>`, `<td class="cart_total"><p class="cart_total_price">Rs. 1000</p></td>`, `<td class="cart_delete"><a class="cart_quantity_delete" data-product-id="1"><i class="fa fa-times"></i></a></td>`. The line total (Rs. 1000) equals unit price (Rs. 500) times quantity (2), confirmed arithmetically correct. A second product (id 2, "Men Tshirt", added with default quantity 1, unit price "Rs. 400") appeared as an independent second row with its own correct line total (Rs. 400 = 400 x 1), confirming multi-item display is per-row and independent.
- QUANTITY IS NOT EDITABLE (confirmed live, contrary to what might be assumed): the quantity cell renders a `<button class="disabled">{n}</button>` — a real `<button>` element, not an `<input>`, and it carries no HTML `disabled` attribute (confirmed via `hasAttribute('disabled')` = false) and is visually clickable (`cursor: pointer`, `pointer-events: auto`), but clicking it was confirmed to produce no change whatsoever to its text content or any other page state. There is no quantity-editing affordance anywhere in the cart UI (no stepper, no editable field, no update/save button). Any "update quantity" scenario is therefore NOT applicable to this page as currently implemented — do not write a test asserting quantity can be changed in the cart; instead assert the button's static, unchanged value after a click, as documented in Scenario 3.1 below.
- NO cart-wide/grand total is displayed anywhere on `/view_cart`, confirmed with two line items simultaneously present (Rs. 1000 + Rs. 400 = Rs. 1400 combined) — no such combined figure appears in the DOM at any level. Only the per-row `.cart_total_price` values exist. Do not write any scenario asserting a cart-wide total element exists.
- Item removal (`a.cart_quantity_delete`, confirmed via `browser_network_requests`) fires a real backend call `GET /delete_cart/{id}` (200 response) and is NOT a full page navigation/reload — the URL remains `/view_cart` throughout, and the corresponding `<tr id="product-{id}">` is removed from the DOM in-page. Confirmed with two items present: deleting product 2's row left exactly one row (`product-1`) remaining, with its data untouched. Deleting the last remaining row correctly reverted the page to the empty-cart state (`#cart_info_table` removed from DOM, `#empty_cart` shown again), all without any navigation (URL stayed `/view_cart` throughout, confirmed via DOM/URL read after each delete, not via title since title never changes per the known quirk above).
- "Proceed to Checkout" login-gate (confirmed live, logged-out session): clicking `a.check_out` (present only when the cart has >=1 item) does NOT navigate anywhere (URL and title both remain unchanged) and instead reveals `<div id="checkoutModal" class="modal show">` in-page (toggling from `modal fade`/`display:none` to `modal show`/visible — confirmed via className/computed-style read before and after the click), containing heading "Checkout", paragraph "Register / Login account to proceed on checkout.", a link with the exact text "Register / Login" and `href="/login"`, and a footer button "Continue On Cart" (`button.close-checkout-modal`, has `data-dismiss="modal"`). Clicking "Continue On Cart" was confirmed to close the modal (`className` reverts to `modal fade`, computed `display` becomes `none`) while the URL stays `/view_cart` — no navigation occurs. Confirmed via `browser_network_requests` that clicking "Proceed to Checkout" fires NO backend request at all — this is a purely client-side Bootstrap-modal toggle (unlike the Add to Cart and Delete actions, which are both backed by real `GET` calls); no API-level coverage applies to this control.
- No seed/reset API applies to this chunk (matches project convention: `tests/seed.spec.ts` is the shared scaffold). Because cart contents persist server-side per session/cookie (confirmed implicitly by items surviving across `/product_details/*` and `/view_cart` navigations within the same browser context), every scenario below should either start from a guaranteed-fresh browser context/state or explicitly add then remove its own items, so scenarios remain independent and repeatable in any order. No login is required for any scenario in this chunk.

Priority legend: [P0]=Critical, [P1]=High, [P2]=Medium, [P3]=Low. Rationale: correctly adding an item and seeing it reflected in the cart (name/price/qty/line total), and correctly gating checkout behind login, are P0 — both are data-integrity-adjacent (a wrong line total or a bypassed login gate would be a serious defect) and every downstream Checkout/Orders chunk depends on the cart and its gate behaving correctly. Multi-item display and deleting-to-empty are P1 (core flows users rely on, one step removed from the single-item happy path). The empty-cart landing state, single-item deletion among many, and the checkout-modal dismissal path are P2/P1 boundary cases important for correctness but not blocking a first-pass transaction. The quantity-is-static-button behavior is P2: it is a boundary/negative-style confirmation (verifying an absence of functionality) rather than a transactional path, but is included because an incorrect assumption here (that quantity is editable) would otherwise silently produce an invalid generated test.

## Test Scenarios

### 1. Empty Cart State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Fresh visit to /view_cart with no items shows the empty-cart state

**File:** `tests/ui/cart/cart-empty.spec.ts`

**Steps:**
  1. In a fresh browser context with no prior Add-to-Cart actions, navigate directly to https://automationexercise.com/view_cart.
    - expect: The '#cart_info_table' element does NOT exist in the DOM (element count equals 0).
    - expect: The '#empty_cart' element is visible and contains the exact text 'Cart is empty!' followed by 'Click here to buy products.'.
    - expect: The 'here' link inside '#empty_cart' has href equal to '/products'.
    - expect: The 'Proceed To Checkout' control ('a.check_out') does NOT exist anywhere on the page (element count equals 0), confirming it only renders when the cart has items.
  2. Click the 'here' link inside the empty-cart message.
    - expect: The resulting page URL equals '/products'.
    - expect: An 'All Products' heading (h2) is visible on the destination page, confirming the empty-cart link correctly routes to product browsing.

### 2. Cart Line-Item Display

**Seed:** `tests/seed.spec.ts`

#### 2.1. Adding a single item via Add to Cart displays its name, category, price, quantity, and correct line total in the cart

**File:** `tests/ui/cart/cart-display.spec.ts`

**Steps:**
  1. Using ProductDetailsPage, navigate to /product_details/1 ('Blue Top', unit price confirmed 'Rs. 500'), set quantity to 2, click Add to Cart, wait for '#cartModal' to appear, then click its 'View Cart' link to navigate to /view_cart.
    - expect: The resulting page URL equals '/view_cart'.
    - expect: '#cart_info_table' is visible and contains exactly 1 row.
    - expect: The row with id 'product-1' is present and shows: a name link with the exact text 'Blue Top' and href '/product_details/1'; category text with the exact text 'Women > Tops'; unit price with the exact text 'Rs. 500'; a quantity control ('.cart_quantity button') with the exact text '2'; and a line total ('.cart_total .cart_total_price') with the exact text 'Rs. 1000', which equals unit price (500) multiplied by quantity (2).

#### 2.2. Adding a second distinct product shows both rows independently with correct per-row data and no combined cart-wide total

**File:** `tests/ui/cart/cart-display.spec.ts`

**Steps:**
  1. Starting from a cart already containing product 1 ('Blue Top', quantity 2, unit price Rs. 500 -- added the same way as the previous scenario), use ProductDetailsPage to navigate to /product_details/2 ('Men Tshirt'), leave quantity at its default, click Add to Cart, then use its cart modal's 'View Cart' link to return to /view_cart.
    - expect: '#cart_info_table' contains exactly 2 rows.
    - expect: The row 'product-1' still shows unit price 'Rs. 500', quantity '2', and line total 'Rs. 1000' (unchanged by the second item being added).
    - expect: The row 'product-2' shows a name link with the exact text 'Men Tshirt' and href '/product_details/2', category text with the exact text 'Men > Tshirts', unit price with the exact text 'Rs. 400', quantity control with the exact text '1' (the default quantity, since it was not changed before adding), and line total with the exact text 'Rs. 400', which equals unit price (400) multiplied by quantity (1).
  2. Search the full '/view_cart' page DOM for any element displaying a combined/grand total figure (e.g. the sum 'Rs. 1400') outside of the two individual '.cart_total_price' cells already asserted above.
    - expect: No such combined-total element exists anywhere on the page (confirmed during exploration this page never renders a cart-wide total) -- this step documents the absence explicitly rather than leaving it untested by omission.

### 3. Cart Quantity Control

**Seed:** `tests/seed.spec.ts`

#### 3.1. Cart quantity is a static, non-editable display control

**File:** `tests/ui/cart/cart-quantity.spec.ts`

**Steps:**
  1. Add product 1 to the cart with quantity 2 (via ProductDetailsPage, as in the display scenarios above) and navigate to /view_cart. Confirm the row's quantity control is a '<button>' element (not an '<input>') by reading its tagName, and confirm it does not carry the HTML 'disabled' attribute.
    - expect: The quantity control's tagName equals 'BUTTON'.
    - expect: The quantity control's 'disabled' HTML attribute is absent (hasAttribute('disabled') is false), confirming it is only visually styled as inactive via its 'disabled' CSS class, not blocked by the native disabled state.
  2. Click the quantity control once.
    - expect: The quantity control's text content remains exactly '2', unchanged by the click, and no input field or editing affordance appears anywhere in the row afterward -- confirming quantity cannot be edited in-place on this page.

### 4. Item Removal

**Seed:** `tests/seed.spec.ts`

#### 4.1. Deleting one of two items removes only that row and leaves the other item and its data intact

**File:** `tests/ui/cart/cart-delete.spec.ts`

**Steps:**
  1. Add product 1 (quantity 2) and product 2 (default quantity) to the cart via ProductDetailsPage and navigate to /view_cart, confirming '#cart_info_table' shows exactly 2 rows ('product-1' and 'product-2'). Then click the delete control ('.cart_delete a.cart_quantity_delete') inside the 'product-2' row.
    - expect: A network request 'GET /delete_cart/2' is observed returning a 200 status.
    - expect: The page URL remains exactly '/view_cart' throughout (no navigation occurred).
    - expect: The row with id 'product-2' no longer exists in the DOM (element count for '#product-2' equals 0).
    - expect: '#cart_info_table' now contains exactly 1 row.
    - expect: The remaining row 'product-1' is unchanged: unit price 'Rs. 500', quantity '2', line total 'Rs. 1000'.

#### 4.2. Deleting the last remaining item returns the cart to the empty-cart state

**File:** `tests/ui/cart/cart-delete.spec.ts`

**Steps:**
  1. Starting from a cart containing exactly one item (product 1, added via ProductDetailsPage as in prior scenarios) on /view_cart, click that row's delete control ('.cart_delete a.cart_quantity_delete' inside '#product-1').
    - expect: A network request 'GET /delete_cart/1' is observed returning a 200 status.
    - expect: The page URL remains exactly '/view_cart' (no navigation/reload occurred).
    - expect: '#cart_info_table' no longer exists in the DOM (element count equals 0).
    - expect: '#empty_cart' is now visible showing the exact text 'Cart is empty!' followed by 'Click here to buy products.', matching the fresh empty-cart state from Scenario 1.1.
    - expect: The 'Proceed To Checkout' control ('a.check_out') no longer exists on the page, confirming it was removed along with the last item.

### 5. Login-Gated Checkout

**Seed:** `tests/seed.spec.ts`

#### 5.1. Clicking 'Proceed to Checkout' while not logged in shows the login/register modal instead of navigating to checkout

**File:** `tests/ui/cart/cart-checkout-gate.spec.ts`

**Steps:**
  1. In a fresh, logged-out browser context, add product 1 to the cart via ProductDetailsPage and navigate to /view_cart. Confirm no network requests to any checkout/payment endpoint have occurred yet, then click the 'Proceed To Checkout' control ('a.check_out').
    - expect: The page URL remains exactly '/view_cart' after the click (no navigation to '/login' or any checkout/payment route occurred).
    - expect: '#checkoutModal' becomes visible (its class changes to include 'show', or equivalently its computed display is no longer 'none').
    - expect: Inside the modal, a heading with the exact text 'Checkout' and a paragraph with the exact text 'Register / Login account to proceed on checkout.' are visible.
    - expect: Inside the modal, a link with the exact text 'Register / Login' has href equal to '/login' (the same destination used by LoginPage.gotoLogin(), confirmed without exercising the login form itself).
    - expect: No network request to a checkout or payment endpoint (e.g. matching '/payment' or '/checkout') is observed as a result of this click, confirming the gate is purely a client-side modal, not a redirected/aborted server-side checkout attempt.
  2. With the modal open, click the 'Continue On Cart' button ('button.close-checkout-modal').
    - expect: '#checkoutModal' becomes hidden again (class no longer includes 'show'; computed display becomes 'none').
    - expect: The page URL remains exactly '/view_cart' -- dismissing the modal does not navigate anywhere.
    - expect: The cart's line item (product 1, 'Blue Top') is still present and unchanged in '#cart_info_table' (row 'product-1' still shows its original price/quantity/total), confirming dismissing the modal does not clear or alter the cart.
