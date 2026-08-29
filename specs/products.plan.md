# Product Catalog & Search Test Plan

## Application Overview

This plan covers the AutomationExercise Product Catalog & Search chunk: the `/products` listing page (product grid, search box with a distinct "searched" state, the Category sidebar's in-page accordion with #Women/#Men/#Kids anchors, and the Brands sidebar's real links to `/brand_products/{Brand}`), plus the `/product_details/{id}` page (quantity input + Add to Cart button that opens the in-page `#cartModal` with no navigation, and the product review submission form). Out of scope: `/category_products/{id}` subcategory listing pages (only their accordion entry-point and link presence are touched here; the pages themselves belong to a future Category chunk), `/view_cart` and checkout (Cart/Checkout chunk, except where scenario 3.2 below intentionally crosses into a cart-row assertion to close an audit gap), and login/account (Account chunk, not required for this chunk's flows).

Page Object plan: `tests/pages/ProductsPage.ts` (extends `BasePage`) covers both `/products` and `/brand_products/{Brand}` since they render the same listing template (Category sidebar, Brands sidebar, product grid). `tests/pages/ProductDetailsPage.ts` (extends `BasePage`) covers `/product_details/{id}`. `tests/pages/CartPage.ts` (extends `BasePage`) covers `/view_cart`, reused as-is (no new locators needed) by scenario 3.2 below. All extend `BasePage.ts` (already implemented, holds header/footer/nav) without duplicating its locators, matching `HomePage.ts`'s established convention of role/id/class selectors (confirmed live: zero `[data-qa]`/`[data-testid]` attributes exist anywhere on `/products`, `/brand_products/Polo`, or `/product_details/1` — same as the Home page, unlike the Account chunk).

`ProductsPage.ts` locators/methods needed: `searchInput` (`#search_product`), `searchButton` (`#submit_search`), `allProductsHeading` (`heading "All Products"`), `searchedProductsHeading` (`heading "Searched Products"`), `categorySidebarHeading` (`heading "Category"`), `categoryWomenLink`/`categoryMenLink`/`categoryKidsLink` (`a[href="#Women"]`/`#Men`/`#Kids`, same pattern as `HomePage.categoryWomenLink`), `brandsHeading` (`heading "Brands"`), `brandLink(brand)` (helper returning `a[href="/brand_products/{brand}"]`), `brandHeading` (the page's `h2` reading "Brand -  {Brand} Products" once on a brand page — note the double space is literal, confirmed live), `productCards` (`.product-image-wrapper` collection), `productViewProductLink(productId)` (a card's `a[href="/product_details/{id}"]`), and per-card helpers scoped to a card: `.productinfo p` (name), `.productinfo h2` (price), `.productinfo` text "Add to cart". Methods: `gotoProducts()` (navigate `/products`, wait for `allProductsHeading`), `gotoBrand(brand)` (navigate `/brand_products/{brand}`, wait for the brand `h2`), `search(term)` (fill `searchInput`, click `searchButton`), `expandCategory('Women'|'Men'|'Kids')` (click the matching anchor), `getProductNames()`/`getProductCount()` (read all card names / count via the grid), `getBrandProductCount(brand)` (parse the sidebar's "(N)" badge for a brand).

`ProductDetailsPage.ts` locators/methods needed: `productInfo` (`.product-information` container), `productNameHeading` (`.product-information h2`), `categoryText` (`.product-information p` reading "Category: X > Y"), `priceText` (the inner `span` reading "Rs. N" inside `.product-information`), `quantityInput` (`#quantity`), `addToCartButton` (`.product-information button.cart`, text "Add to cart"), `availabilityText`/`conditionText`/`brandText` (the three `<p><b>...` lines), `cartModal` (`#cartModal`), `cartModalAddedHeading` (`heading "Added!"` scoped to the modal), `cartModalMessage` (paragraph "Your product has been added to cart." scoped to the modal), `viewCartModalLink` (`a[href="/view_cart"]` scoped to the modal), `continueShoppingButton` (button "Continue Shopping" scoped to the modal), `reviewForm` (`#review-form`), `reviewNameInput` (`#name`), `reviewEmailInput` (`#email`), `reviewTextInput` (`#review`), `reviewSubmitButton` (`#button-review`), `reviewSuccessSection` (`#review-section`, the `alert-success` "Thank you for your review." container, hidden via a `hide` class by default). Methods: `gotoProduct(id)` (navigate `/product_details/{id}`, wait for `productNameHeading`), `setQuantity(n)` (fill `quantityInput`), `addToCart()` (click `addToCartButton`, wait for `cartModal` to become visible), `addToCartAndViewCart(id, quantity?)` (compose gotoProduct + optional setQuantity + addToCart + click viewCartModalLink, reused by scenario 3.2 below), `submitReview({name, email, review})`.

`CartPage.ts` (reused by scenario 3.2 below, no new locators needed for this chunk): `gotoCart()`, `row(productId)` (scoped `#product-{id}` row), `rowNameLink(productId)`, `rowCategory(productId)`, `rowUnitPrice(productId)`, `rowQuantityControl(productId)`, `rowLineTotal(productId)`.

Confirmed technical facts from live exploration (to prevent the generator from guessing):
- `/products` default load (no query string) shows the "All Products" `h2` heading with 34 product cards; each card shows a price formatted "Rs. <number>", a product name paragraph, an "Add to cart" control, and a "View Product" link to `/product_details/{id}`.
- Search is a plain GET form: filling `#search_product` and clicking `#submit_search` navigates to `/products?search={term}` (full page reload, confirmed by URL change and title staying "Automation Exercise - All Products"; NOT an XHR/AJAX call — confirmed via `browser_network_requests`, no matching fetch/XHR appeared, only the full-document GET for the new URL). The results heading changes from "All Products" to "Searched Products". Searching "Top" returned 14 product cards (confirmed by reading all `.productinfo p` names) — note the match is not a strict name-substring match (e.g. "Little Girls Mr. Panda Shirt" and "Colour Blocked Shirt – Sky Blue" were both included), so assertions should check against the heading + a non-zero/expected count rather than asserting every returned name literally contains the search term.
- No-results search (`/products?search=zzzznonexistentproduct123`, a string confirmed to match no product) still shows the "Searched Products" heading but renders zero `.product-image-wrapper` cards and no dedicated "no products found" message — the empty grid IS the no-results state.
- An empty search term (`/products?search=`) is NOT treated as a search at all: the page falls back to the default "All Products" heading with all 34 products shown (confirmed via `browser_evaluate`), i.e. an empty query string does not produce a "Searched Products"/empty state.
- The Category sidebar (`heading "Category"`) has exactly three top-level panel links — Women (`a[href="#Women"]`), Men (`a[href="#Men"]`), Kids (`a[href="#Kids"]`) — implemented as a Bootstrap accordion (`panel-group`), confirmed purely client-side (no network request fires on click). It is single-open: clicking "Men" while "Women" is expanded collapses Women (its link's class reverts to `collapsed`) and expands Men (confirmed live by reading each panel link's `className` before/after). Expanding a panel reveals subcategory links (e.g. under Women: "Dress" -> `/category_products/1`, "Tops" -> `/category_products/2`, "Saree" -> `/category_products/7`) which ARE real full-page navigations (confirmed: clicking "Dress" navigated to `/category_products/1`, title "Automation Exercise - Dress Products") — however testing those destination pages is explicitly OUT OF SCOPE for this plan; only the accordion expand/collapse behavior and the presence of subcategory links are covered here.
- The Brands sidebar (`heading "Brands"`) lists real links to `/brand_products/{Brand}` (e.g. Polo, H&M, Madame, Mast & Harbour, Babyhug, Allen Solly Junior, Kookie Kids, Biba), each prefixed with a "(N)" product-count badge. Navigating to `/brand_products/Polo` (confirmed live, re-confirmed again on 2026-08-29) shows title "Automation Exercise - Polo Products", an `h2` reading exactly "Brand -  Polo Products" (double space is literal, confirmed via DOM read), and exactly 6 product cards — matching the sidebar's "(6)" badge for Polo. The 6 confirmed Polo products (id/name/price): 1 "Blue Top" Rs. 500, 8 "Fancy Green Top" Rs. 700, 29 "Green Side Placket Detail T-Shirt" Rs. 1000, 30 "Premium Polo T-Shirts" Rs. 1500, 33 "Soft Stretch Jeans" Rs. 799, 37 "Grunt Blue Slim Fit Jeans" Rs. 1400.
- `/product_details/{id}` (confirmed on id=1, "Blue Top"): shows `h2` product name, "Category: {Parent} > {Sub}" text, price "Rs. {N}", a `Quantity:` label with a native number input `#quantity` (`type="number"`, `min="1"`, no `max` attribute, default value "1"), an "Add to cart" button, and "Availability: In Stock" / "Condition: New" / "Brand: {Brand}" lines. Also confirmed on id=8 ("Fancy Green Top", Polo brand, on 2026-08-29): "Category: Women > Tops", price "Rs. 700", "Brand: Polo".
- Add to Cart IS backed by a real network call — confirmed via `browser_network_requests`: clicking "Add to cart" fires `GET /add_to_cart/{id}?quantity={n}` (200 response) reflecting whatever value was in `#quantity` at click time (confirmed: setting quantity to 4 before clicking produced `?quantity=4` on product 1; re-confirmed on product 8 with quantity 3 producing `?quantity=3`, both 200). This differs from the Home page's newsletter subscription (which is purely client-side) — API-level coverage could apply to this endpoint if the project later adds one, but is out of scope for this UI-level plan.
- Add to Cart does NOT navigate away: the URL stays `/product_details/{id}` and a Bootstrap modal `#cartModal` is shown in-page (confirmed via class/computed-style change, `modal fade` -> gains `show`/`in`), containing heading "Added!", paragraph "Your product has been added to cart.", a "View Cart" link (`href="/view_cart"`), and a "Continue Shopping" button. Clicking "Continue Shopping" closes the modal in-page (confirmed: class reverts to plain `modal fade`, computed `display` becomes `none`) without navigating anywhere. Clicking "View Cart" instead navigates to `/view_cart` and renders the added item as a real row in `#cart_info_table` (confirmed live on 2026-08-29 for product 8, quantity 3: row shows name "Fancy Green Top" linking to `/product_details/8`, category "Women > Tops", unit price "Rs. 700", quantity control reading "3", and line total "Rs. 2100" — exactly 700 x 3, confirming the cart's total column is a real computed value and not a static placeholder).
- The review form (`#review-form`) has three required fields: `#name` (text), `#email` (type="email"), `#review` (textarea) — all carry the HTML `required` attribute (confirmed via outerHTML read), and a `#button-review` submit button. A hidden sibling `#review-section` (class `form-row hide`) contains the intended success message "Thank you for your review." in an `.alert-success` block.
- AMBIGUOUS / NOT FULLY CONFIRMED: submitting a fully-filled, valid review (twice, in two separate fresh page loads) reproducibly cleared all three field values to empty strings afterward, but the `#review-section` success message never became visible in either run (class stayed `form-row hide`, computed `display` stayed `none`) even after an extended wait, and no corresponding POST/XHR network request to `automationexercise.com` was observed in either run. This may be an environment/automation-specific quirk (e.g. a reCAPTCHA-gated endpoint that silently no-ops for automated traffic) rather than true site behavior. Recommendation for the Generator: only assert the field-reset behavior (which was consistently reproducible) as the "submission was accepted client-side" signal; do NOT hard-assert that the "Thank you for your review." alert becomes visible without the team first re-confirming this manually, since a hard assertion on that text risks being a flaky/false-negative test given what was observed here.
- No seed/reset API applies to this chunk (matches project convention): all product/brand/category data is read-only content, used as-is and never mutated except for the anonymous, ephemeral "add to cart" action itself (which is a real but harmless server-side call with no persistent account tied to it). `tests/seed.spec.ts` is the shared scaffold. No login is required for any scenario in this chunk, including scenario 3.2 which performs a real anonymous add-to-cart.

Priority legend: [P0]=Critical, [P1]=High, [P2]=Medium, [P3]=Low. Rationale: the default product grid rendering and the Add to Cart -> modal flow on the product details page are P0, since every downstream Cart/Checkout chunk scenario depends on being able to browse to a product and add it to the cart — if either breaks, no transactional flow can be tested at all. Search's happy path, brand-page navigation, and the brand-to-cart flow (scenario 3.2, closing TC19) are P1 (core discovery-to-cart paths users rely on, but not the single universal add-to-cart path already covered at P0 by scenario 4.2). Category accordion behavior, search edge cases (empty/no-results), and quantity-respected-in-request are P2 (secondary navigation aids / boundary correctness, self-contained). The review form is P3: it is a non-transactional, informational feature, and given the confirmed ambiguity around its success-message visibility, its test value is inherently lower-confidence until the team clarifies expected behavior.

## Test Scenarios

### 1. Products Listing

**Seed:** `tests/seed.spec.ts`

#### 1.1. [P1-High] Default /products load shows the full 'All Products' grid with well-formed cards

**File:** `tests/ui/products/products-listing.spec.ts`

**Steps:**
  1. Navigate to https://automationexercise.com/products (fresh/blank browser state). Do not search or filter.
    - expect: Page title equals 'Automation Exercise - All Products'.
    - expect: An 'All Products' heading (h2) is visible.
    - expect: The product grid contains exactly 34 product cards ('.product-image-wrapper' count equals 34, matching the count confirmed during exploration).
    - expect: The first card (product id 1, 'Blue Top') shows a price heading with the exact text 'Rs. 500', a name paragraph with the exact text 'Blue Top', an 'Add to cart' control, and a 'View Product' link with href '/product_details/1'.
  2. Click the 'View Product' link on the first product card ('Blue Top').
    - expect: The resulting page URL equals '/product_details/1'.
    - expect: The product name heading (h2) on the destination page has the exact text 'Blue Top', confirming navigation landed on the correct product's detail page.

#### 1.2. [P2-Medium] Category sidebar accordion expands the clicked panel and collapses any previously open one

**File:** `tests/ui/products/products-category.spec.ts`

**Steps:**
  1. On a freshly loaded /products page, confirm no category panel is expanded by default (no subcategory links visible under Women, Men, or Kids), then click the 'Women' category link.
    - expect: Subcategory links appear under Women, including at minimum a link with href '/category_products/1' (Dress), '/category_products/2' (Tops), and '/category_products/7' (Saree).
    - expect: The Women panel link's class no longer includes 'collapsed' (i.e. it is expanded).
  2. Without navigating away, click the 'Men' category link.
    - expect: The Women panel link's class now includes 'collapsed' again (Women has collapsed) and its subcategory links are no longer visible.
    - expect: The Men panel link's class no longer includes 'collapsed' (Men is now expanded) and at least one subcategory link is visible under it.
    - expect: The page URL is still '/products' throughout (the accordion toggle causes no navigation).

### 2. Product Search

**Seed:** `tests/seed.spec.ts`

#### 2.1. [P1-High] Searching for an existing term shows the 'Searched Products' state with matching results

**File:** `tests/ui/products/products-search.spec.ts`

**Steps:**
  1. On a freshly loaded /products page, confirm the search input (#search_product) is empty, then fill it with 'Top' and click the search button (#submit_search).
    - expect: The resulting page URL equals '/products?search=Top'.
    - expect: A 'Searched Products' heading (h2) is visible (replacing 'All Products').
    - expect: The product grid contains exactly 14 product cards, matching the count confirmed during exploration for this exact search term.

#### 2.2. [P2-Medium] Searching for a term with no matches shows an empty 'Searched Products' grid

**File:** `tests/ui/products/products-search.spec.ts`

**Steps:**
  1. On a freshly loaded /products page, fill the search input with a string guaranteed not to match any product (e.g. 'zzzznonexistentproduct123') and submit the search.
    - expect: The resulting page URL equals '/products?search=zzzznonexistentproduct123'.
    - expect: A 'Searched Products' heading (h2) is still visible.
    - expect: The product grid contains exactly 0 product cards ('.product-image-wrapper' count equals 0).

#### 2.3. [P2-Medium] Submitting an empty search term falls back to the full 'All Products' listing (boundary case)

**File:** `tests/ui/products/products-search.spec.ts`

**Steps:**
  1. Navigate directly to /products?search= (empty search query string, reproducing submitting the search form with an empty input).
    - expect: The heading shown is 'All Products', NOT 'Searched Products' — confirming an empty search term is not treated as an active search.
    - expect: The product grid contains exactly 34 product cards, i.e. the same full listing as the unfiltered default state.

### 3. Brand Filtering

**Seed:** `tests/seed.spec.ts`

#### 3.1. [P1-High] Clicking a brand link navigates to its dedicated listing showing only that brand's products

**File:** `tests/ui/products/products-brand.spec.ts`

**Steps:**
  1. On a freshly loaded /products page, read the 'Polo' brand link's product-count badge text (expected to read '(6)' based on exploration; read it live rather than hardcoding, in case catalog content changes), then click the 'Polo' brand link.
    - expect: The resulting page URL equals '/brand_products/Polo'.
    - expect: Page title equals 'Automation Exercise - Polo Products'.
    - expect: A heading (h2) with the exact text 'Brand -  Polo Products' (note: two spaces between the hyphen and 'Polo', confirmed literal) is visible.
    - expect: The number of product cards displayed ('.product-image-wrapper' count) equals the numeric value read from the Polo badge in step 1 (6, at time of exploration), confirming the brand filter's displayed count matches its sidebar badge.
  2. On the resulting /brand_products/Polo page, confirm the same Category and Brands sidebars are still present and functional (e.g. the Brands list still shows all brand links including Polo itself).
    - expect: The 'Brands' heading and the full brand link list are visible on the brand-filtered page, confirming the brand page reuses the same listing template/sidebar as /products.

#### 3.2. [P1-High] Viewing a brand-filtered product's details and adding it to cart reflects correctly in the cart (closes TC19 'View & Cart Brand Products' audit gap)

**File:** `tests/ui/products/products-brand.spec.ts`

**Steps:**
  1. On a freshly loaded browser state, navigate to https://automationexercise.com/brand_products/Polo (ProductsPage.gotoBrand('Polo')). No new Page Object is needed for this scenario: ProductsPage.gotoBrand/productViewProductLink, ProductDetailsPage.gotoProduct/setQuantity/addToCart/viewCartModalLink, and CartPage.row/rowNameLink/rowCategory/rowUnitPrice/rowQuantityControl/rowLineTotal already cover every step below.
    - expect: The resulting page URL equals '/brand_products/Polo' and the brand heading (h2) reads 'Brand -  Polo Products' (double space literal, same as confirmed in scenario 3.1).
    - expect: The product grid contains exactly 6 product cards, consistent with scenario 3.1's confirmed Polo count.
    - expect: Among the 6 cards, one specific card is present with a 'View Product' link href '/product_details/8', a price heading with the exact text 'Rs. 700', and a name paragraph with the exact text 'Fancy Green Top' — all three values confirmed live during exploration on 2026-08-29 and hardcoded here per this project's established convention of using confirmed-live catalog values rather than scraping unstable text at runtime.
  2. Click the 'View Product' link for product id 8 (ProductsPage.productViewProductLink(8)) to navigate to its detail page.
    - expect: The resulting page URL equals '/product_details/8'.
    - expect: The product name heading (h2) has the exact text 'Fancy Green Top', confirming navigation landed on the correct brand-filtered product's detail page.
    - expect: A paragraph shows the exact text 'Category: Women > Tops'.
    - expect: The price element shows the exact text 'Rs. 700'.
    - expect: A paragraph shows the exact text 'Brand: Polo', confirming this product does in fact belong to the brand it was filtered/reached by.
  3. Set the quantity input (#quantity) to '3' (ProductDetailsPage.setQuantity(3)), then click 'Add to cart' (ProductDetailsPage.addToCart()).
    - expect: A network request 'GET /add_to_cart/8?quantity=3' is observed returning a 200 status, confirming this exact product id and quantity were passed through to the backend call (confirmed live during exploration).
    - expect: The '#cartModal' becomes visible showing heading 'Added!', message 'Your product has been added to cart.', a 'View Cart' link (href '/view_cart'), and a 'Continue Shopping' button — same modal contract already confirmed in scenario 4.2.
  4. Click the modal's 'View Cart' link (ProductDetailsPage.viewCartModalLink) to navigate to the cart. (Equivalently, steps 1-4 can be performed via ProductDetailsPage.addToCartAndViewCart(8, 3) once the earlier brand-page navigation/assertions are done.)
    - expect: The resulting page URL equals '/view_cart' and the cart table (#cart_info_table) is visible (not the empty-cart message), since an item was just added.
  5. On the resulting cart page, locate the row for product id 8 (CartPage.row(8)) and verify each of its cells.
    - expect: The row's name link (CartPage.rowNameLink(8)) has the exact text 'Fancy Green Top' and href '/product_details/8', confirming the correct brand-filtered product carried through into the cart.
    - expect: The row's category text (CartPage.rowCategory(8)) has the exact text 'Women > Tops'.
    - expect: The row's unit price (CartPage.rowUnitPrice(8)) has the exact text 'Rs. 700'.
    - expect: The row's quantity control (CartPage.rowQuantityControl(8)) shows the exact text '3', matching the quantity set on the product details page.
    - expect: The row's line total (CartPage.rowLineTotal(8)) has the exact text 'Rs. 2100', which equals unit price (700) multiplied by quantity (3) — confirmed live to match this exact arithmetic, not merely a hardcoded snapshot value.

### 4. Product Details & Add to Cart

**Seed:** `tests/seed.spec.ts`

#### 4.1. [P1-High] Product details page renders all expected product information

**File:** `tests/ui/products/product-details.spec.ts`

**Steps:**
  1. Navigate directly to https://automationexercise.com/product_details/1 (fresh/blank browser state).
    - expect: The product name heading (h2) has the exact text 'Blue Top'.
    - expect: A paragraph shows the exact text 'Category: Women > Tops'.
    - expect: The price element shows the exact text 'Rs. 500'.
    - expect: The quantity input (#quantity) has value '1' (confirmed default) and attributes type='number', min='1'.
    - expect: Paragraphs show the exact texts 'Availability: In Stock', 'Condition: New', and 'Brand: Polo'.
    - expect: The '#cartModal' element is present in the DOM but not visible (no 'show'/'in' class, computed display 'none') prior to any Add to Cart click.

#### 4.2. [P0-Critical] Adding a product to the cart with a custom quantity opens the confirmation modal without navigating away

**File:** `tests/ui/products/product-details.spec.ts`

**Steps:**
  1. On a freshly loaded /product_details/1 page, clear the quantity input and fill it with '4', then click the 'Add to cart' button.
    - expect: A network request 'GET /add_to_cart/1?quantity=4' is observed returning a 200 status, confirming the quantity value was passed through to the backend call.
    - expect: The page URL remains exactly '/product_details/1' (no navigation occurred).
    - expect: The '#cartModal' element becomes visible (gains a 'show'/'in' class or computed display becomes visible).
    - expect: Inside the modal, a heading with the exact text 'Added!' and a paragraph with the exact text 'Your product has been added to cart.' are visible.
    - expect: Inside the modal, a 'View Cart' link with href '/view_cart' and a 'Continue Shopping' button are both visible.
  2. Click the 'Continue Shopping' button inside the modal.
    - expect: The '#cartModal' becomes hidden again (its class no longer includes 'show'/'in'; computed display becomes 'none').
    - expect: The page URL remains '/product_details/1' — Continue Shopping does not navigate anywhere.
    - expect: The quantity input still shows '4' (the page underneath was not reset/reloaded by closing the modal).

#### 4.3. [P2-Medium] Quantity input rejects values below its minimum (boundary case)

**File:** `tests/ui/products/product-details.spec.ts`

**Steps:**
  1. On a freshly loaded /product_details/1 page, use the quantity input's native attributes to attempt setting a value of '0' (below the confirmed min='1'), e.g. via fill('0') followed by reading the input's ValidityState.
    - expect: Evaluating the '#quantity' input's ValidityState shows 'valid' is false and 'rangeUnderflow' is true, confirming the native HTML min='1' constraint is what blocks the out-of-range value (not a custom JS validator).

### 5. Product Review Submission

**Seed:** `tests/seed.spec.ts`

#### 5.1. [P3-Low] Submitting a fully completed review clears the form fields (best-effort assertion; success alert visibility is unconfirmed)

**File:** `tests/ui/products/product-review.spec.ts`

**Steps:**
  1. On a freshly loaded /product_details/1 page, confirm '#name', '#email', and '#review' are all empty, then fill them with a test name, a syntactically valid non-personal test email (e.g. 'test.reviewer.qa@example.com' — do not use any real personal email address for this public, permanently-visible form), and a short review string, then click '#button-review'.
    - expect: After clicking submit, '#name', '#email', and '#review' all have an empty string value (this field-reset behavior was reproducibly confirmed twice during exploration and is the most reliable 'submission was processed' signal for this form).
    - expect: NOTE FOR IMPLEMENTER: do NOT additionally hard-assert that the '#review-section' success alert ('Thank you for your review.') becomes visible — during exploration this success message did not appear in two separate confirmed attempts despite the fields resetting, and no network request for the submission was observed either. Treat visibility of that alert as an open question requiring team confirmation before asserting on it; if included, it should be a soft/non-blocking check, not a hard failure condition.

#### 5.2. [P2-Medium] Leaving a required review field empty blocks submission via native HTML validation

**File:** `tests/ui/products/product-review.spec.ts`

**Steps:**
  1. On a freshly loaded /product_details/1 page, fill '#email' and '#review' with valid values but leave '#name' empty, then click '#button-review'.
    - expect: Evaluating the '#name' input's ValidityState shows 'valid' is false and 'valueMissing' is true, confirming the HTML 'required' attribute (not a server round-trip) blocks submission.
    - expect: The '#email' and '#review' values are unchanged/still populated (no fields were cleared), confirming no submission was processed.
