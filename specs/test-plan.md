# AutomationExercise E2E — Test Strategy

This is the top-level, committed test strategy for the `https://automationexercise.com/` suite. It
is distinct from the per-area implementation plans (e.g. `specs/home.plan.md`): those documents
contain step-by-step scenarios for one functional area; this document defines overall scope, the
full chunk breakdown, priority order, and the shared technical conventions every per-chunk plan must
follow. Produced from a full-site discovery pass (August 2026) covering navigation, forms, and
locator/attribute availability across every major section reachable from the header/footer nav.

## 1. Scope

**In scope:** functional UI regression coverage of the public-facing site at
`https://automationexercise.com/` — page loads and content, primary navigation, product browsing and
search, cart management, the account/auth flows (register, login, logout), the checkout/order-placement
flow, the contact form, and read-only checks of the two informational pages (Test Cases, API Testing).
Also in scope: a lightweight API-level suite against the documented REST endpoints listed on
`/api_list` (`tests/api/**`), run as a parallel track to the UI suite rather than through the UI.

**Out of scope for this suite:** performance/load testing, accessibility (a11y) auditing, visual
regression/screenshot diffing, cross-browser-specific CSS assertions beyond functional pass/fail,
payment gateway correctness (the site's payment step is a mock form with no real processor — only
its client-side flow is covered), third-party integrations (the Video Tutorials nav item links out to
YouTube; only the link target is verified, not YouTube's own UI), and email delivery verification (no
mailbox is provisioned — subscription/contact-form submissions are verified via DOM/response state
only, never via a received email).

## 2. Functional Chunks

Each chunk below is planned and built independently (`specs/<chunk>.plan.md` → `tests/<chunk>/`),
following the pipeline in the project's operating process (Plan → Page Object → Generate → Verify →
Heal → Docs Sync).

| # | Chunk | Primary URL(s) | Status |
|---|-------|----------------|--------|
| 1 | Home Page | `/` | **Implemented** |
| 2 | Account / Auth | `/login`, `/signup` | **Implemented** |
| 3 | Product Catalog & Search | `/products`, `/product_details/{id}`, `/brand_products/{brand}` | **Implemented** |
| 4 | Cart | `/view_cart` | **Implemented** |
| 5 | Checkout / Orders | `/view_cart` → `/login` → `/payment` → order confirmation | **Implemented** |
| 6 | Contact Us | `/contact_us` | **Implemented** |
| 7 | Informational Pages (Test Cases, API Testing) | `/test_cases`, `/api_list` | **Implemented** |
| 8 | API Test Track | `/api/*` (REST, no browser) | **Implemented** |
| 9 | Cross-Page Navigation | all of the above | **Implemented** |

Chunk 1 (Home) already has `specs/home.plan.md`, `tests/pages/BasePage.ts`, `tests/pages/HomePage.ts`,
and `tests/ui/home/home.spec.ts` implemented and passing — treat it as the first completed chunk under
this strategy, not something to replan or regenerate.

Chunk 8 (API Test Track) is now fully implemented: `tests/api/products.spec.ts` (GET/POST
`/api/productsList`), `tests/api/brands.spec.ts` (GET/PUT `/api/brandsList`), `tests/api/search.spec.ts`
(POST `/api/searchProduct`, valid and missing-param), `tests/api/login.spec.ts` (POST `/api/verifyLogin`
valid/missing-param/invalid-credentials, GET `/api/verifyLogin` method-not-supported), and
`tests/api/account.spec.ts` (POST `/api/createAccount`, PUT `/api/updateAccount`, DELETE
`/api/deleteAccount`, GET `/api/getUserDetailByEmail`) — 12 tests across all five files, 48 test
executions across chromium/firefox/webkit, all documented endpoints on `/api_list` covered.

### Chunk descriptions

- **Account / Auth** — `/login` hosts two independent forms: "Login to your account" and "New User
  Signup!" (name + email only). Submitting Signup navigates to `/signup`, a full "Enter Account
  Information" form (title, password, DOB, address block) that on submit creates a real account and
  logs the user in. Logout and Delete Account are reachable only once logged in — both are now
  exercised and covered (`tests/ui/account/logout.spec.ts`, `tests/ui/account/delete-account.spec.ts`). This
  chunk gates Checkout (chunk 5) — any account created for checkout tests must be either disposable
  (create + delete per test) or a fixed seeded test user; see Test Data section below.
- **Product Catalog & Search** — `/products` lists all products with a search box, sidebar category
  filter (in-page anchors: `#Women`, `#Men`, `#Kids`, not separate URLs), and a real Brands list
  (separate URLs, `/brand_products/{Brand}`). `/product_details/{id}` covers quantity selection, Add to
  Cart (opens an in-page modal, no navigation), and a review submission form. Feeds directly into Cart.
- **Cart** — `/view_cart` (note: page `<title>` is "Automation Exercise - Checkout" even when just
  viewing the cart, not just at actual checkout — do not assert on title alone to detect checkout vs.
  cart-view state). Handles empty-cart state, line-item display, and initiates the login-gated
  Proceed to Checkout flow (`#checkoutModal` appears when not logged in).
- **Checkout / Orders** — depends on both Account/Auth (must be logged in) and Cart (must have at
  least one item) being functional first; sequence this chunk after both. Covers address confirmation,
  the mock payment form, order placement confirmation, and (per the Test Cases page) invoice download.
- **Contact Us** — `/contact_us` simple form (Name, Email, Subject, Message, file upload, Submit).
  Independent of other chunks; low cross-dependency risk.
- **Informational Pages** — `/test_cases` and `/api_list` are static documentation pages (client-side
  Bootstrap accordions, no backend calls). Coverage here is intentionally light: page-load and
  content-presence smoke checks only, not full interaction testing — these pages don't drive user
  transactions. Now implemented; see §13.
- **API Test Track** — runs as `tests/api/**`, using Playwright's `request` fixture directly against
  the documented endpoints on `/api_list` (products, brands, search, login/account CRUD). This is a
  separate track from the UI suite: no browser, no Page Objects, faster and more stable. Now fully
  implemented across all documented endpoints; see §11.
- **Cross-Page Navigation** — a dedicated suite (mirroring the existing project convention of
  `tests/componentsnavigation.spec.ts`-style checks in sibling projects) that walks the primary header
  nav across pages end-to-end, confirming each link's destination and back-navigation, reusing
  `BasePage` nav locators rather than duplicating them. Planned last since it depends on every other
  chunk's Page Objects existing first.

## 3. Priority / Risk Ranking

Ranking is risk-based: a chunk ranks higher when its failure blocks other user journeys (critical
path) or represents core transactional functionality; lower when it's a self-contained,
non-transactional, or purely informational feature.

| Priority | Chunk | Rationale |
|---|---|---|
| P0 — Critical | Home Page | **Done.** Entry point for all journeys; already implemented. |
| P0 — Critical | Account / Auth | Every transactional flow (checkout, order history, account deletion) is gated behind login; a broken signup/login blocks everything downstream. |
| P0 — Critical | Product Catalog & Search | The only path to populate a cart; broken browsing/search blocks Cart and Checkout entirely. |
| P0 — Critical | Cart | Sits directly between browsing and checkout; broken cart state blocks all purchases. |
| P0 — Critical | Checkout / Orders | Core business transaction of the site; highest business impact if broken, but can only be planned once Account and Cart are stable (its Page Object composes both). |
| P1 — High | API Test Track | Fast, stable, high-value regression signal for the same core entities (products, brands, accounts) at a layer decoupled from UI flakiness; cheap to extend incrementally. **Done.** |
| P2 — Medium | Contact Us | Self-contained lead-gen form; not on the purchase critical path. **Done.** |
| P2 — Medium | Cross-Page Navigation | Valuable regression net once individual chunks exist, but by definition can't be built first and duplicates some coverage already in per-chunk plans. **Done.** |
| P3 — Low | Informational Pages | Static documentation content; smoke-level checks only, no transactional risk. **Done.** |

**Recommended build order:** Home (done) → Account/Auth (done) → Product Catalog & Search (done) →
Cart (done) → Checkout/Orders (done) → API Test Track (done, ran in parallel with no ordering
dependency) → Contact Us (done) → Cross-Page Navigation (done) → Informational Pages (done). All nine
chunks in this strategy are now implemented.

## 4. Shared Technical Conventions

### Page Object Model structure

- `tests/pages/BasePage.ts` is the shared base class (already implemented). It owns the primary
  header nav locators (`homeNavLink`, `productsNavLink`, `cartNavLink`, `signupLoginNavLink`,
  `testCasesNavLink`, `apiTestingNavLink`, `videoTutorialsNavLink`, `contactUsNavLink`), the footer/
  subscription widget, and the scroll-to-top control, plus generic `goto(path)` / `waitForLoad()`
  helpers. Every new page object (`LoginPage`, `SignupPage`, `ProductsPage`, `ProductDetailsPage`,
  `CartPage`, `CheckoutPage`, `ContactUsPage`, etc.) must extend `BasePage` rather than re-declaring
  nav/footer locators.
- One Page Object per distinct page/URL pattern (not per test file). E.g. `ProductDetailsPage` covers
  `/product_details/{id}` regardless of which product id is under test.
- Readonly `Locator` fields declared in the constructor (matching `HomePage.ts`'s existing style),
  plus helper methods for any multi-step interaction pattern used by more than one test (e.g. a future
  `CartPage.removeItem(name)`، `LoginPage.login(email, password)`).
- A raw locator pattern repeated in two or more spec files anywhere in `tests/` is a signal a shared
  helper belongs on the relevant Page Object (or `BasePage`, if the pattern is nav/footer-level) — this
  is checked at every chunk's cleanup step, not just at the end.

### Locator strategy (per-page — confirmed by the discovery pass)

`data-qa` attributes are **not** uniformly present across the site. Confirmed distribution:

| Page | `data-qa` present? |
|---|---|
| Home (`/`) | No |
| Products listing (`/products`) | No |
| Product Detail (`/product_details/{id}`) | No |
| Cart (`/view_cart`) | No |
| Login / Signup entry (`/login`) | **Yes** — `login-email`, `login-password`, `login-button`, `signup-name`, `signup-email`, `signup-button` |
| Account Information (`/signup`) | **Yes** — `title`, `name`, `email`, `password`, `days`, `months`, `years`, `first_name`, `last_name`, `company`, `address`, `address2`, `country`, `state`, `city`, `zipcode`, `mobile_number`, `create-account` |
| Contact Us (`/contact_us`) | **Yes** — `name`, `email`, `subject`, `message`, `submit-button` |

Rule of thumb per chunk plan: **use `page.getByTestId()`-style `[data-qa=...]` locators wherever they
exist** (Account/Auth, Contact Us) — they're the most stable option and should be preferred over role/
text locators there. On pages without `data-qa` (Home, Products, Product Detail, Cart), fall back to
the same approach already validated in `HomePage.ts`: `getByRole` scoped to a landmark, stable `id`/
class selectors (`#slider-carousel`, `.productinfo`), or `href`-based matches when accessible names are
ambiguous or icon-prefixed. Do not assume `data-qa` coverage on a new page without confirming it during
that chunk's own planning pass — it is not uniform.

### Test data / seeding approach

- `tests/seed.spec.ts` remains the shared scaffold every planner/generator run is set up against; any
  change to it is higher-blast-radius than a single chunk and must be treated as a whole-suite
  concern, not a local one.
- The site has no test-only reset/seed API — all "seed data" is either (a) read-only content already
  on the site (existing products/brands, used as-is, never mutated) or (b) account/order data created
  and cleaned up by the test itself within the same run.
- Account/Auth and Checkout tests that must create a real account should generate a unique email per
  test run (timestamp/random suffix, matching the pattern already used for the Home subscription
  email tests) rather than relying on a fixed shared account, to keep tests independent and
  re-runnable — and should delete the created account at the end of the test (the site exposes a
  Delete Account action) wherever the flow under test allows it, to avoid accumulating orphaned
  accounts on the shared public site.
- No local/mocked backend is used; all UI tests run against the live public site
  (`https://automationexercise.com`, per `playwright.config.ts` `baseURL`). The API Test Track
  (`tests/api/**`) hits the same live REST endpoints via Playwright's `request` fixture, independent of
  browser state.

### Cross-chunk dependency sequencing

- **Checkout/Orders** depends on both **Account/Auth** (must be able to log in) and **Cart** (must be
  able to add an item) being implemented first; its Page Object should compose `LoginPage`/`SignupPage`
  and `CartPage` rather than reimplement their steps.
- **Cross-Page Navigation** depends on every chunk it walks through having a stable Page Object
  already in place; plan and build it last so it reuses existing locators instead of inventing
  parallel ones (mirrors the same rule already enforced for component-navigation suites in this
  project's operating process).
- **API Test Track** has no UI dependency and can be built in parallel with any UI chunk at any time.
- **Contact Us** and **Informational Pages** have no dependencies on other chunks and can be sequenced
  opportunistically (e.g. as a lower-priority filler between higher-priority chunks).

## 5. Home Page — Implemented

**Status:** Fully planned (`specs/home.plan.md`, 8 scenarios, P0–P3) and implemented across four spec
files under `tests/ui/home/` (`home.spec.ts`, `home-subscription.spec.ts`, `home-recommended-items.spec.ts`,
`home-scroll.spec.ts` — 8 tests total, `home-scroll.spec.ts` now holding two independent scenarios),
plus `tests/pages/BasePage.ts` and `tests/pages/HomePage.ts`. Confirmed passing across chromium,
firefox, and webkit (15/15 in a targeted run of the two most-recently-added files; the rest of the
chunk was previously confirmed green and untouched by this pass).

Notable quirks captured during this chunk (relevant to conventions above): no `data-qa` attributes
anywhere on the home page; header nav item accessible names carry a leading icon-font glyph that must
be stripped before text comparison; the newsletter subscription widget is entirely client-side (no
backend endpoint) and validated via native HTML5 `ValidityState`, not network assertions; the
scroll-to-top control is present in the DOM at all times, gated only by CSS `display`.

Two audit-gap scenarios (1.7 TC22, 1.8 TC26) were added in a later pass, closing gaps found against
AutomationExercise's official Test Cases list. `home-recommended-items.spec.ts` (TC22) confirms the
"recommended items" carousel's Add to Cart control (sharing the same `.add-to-cart`/`data-product-id`
markup as the main Features Items grid) correctly adds the currently-active group's product and that
it renders correctly in the cart afterward, handling the carousel's confirmed non-deterministic
default-active-group behavior by checking which group is visible before asserting on it.
`home-scroll.spec.ts` (TC26) confirms plain native browser scrolling (`window.scrollTo`/wheel) moves
the page down and back up correctly, independent of the `#scrollUp` arrow control. A genuine,
firefox-only, deterministic test-side defect was found and fixed here: `BasePage.scrollToBottom()`
used a large-delta synthetic `page.mouse.wheel(0, 20000)` with no wait afterward; Firefox's
wheel-event emulation was confirmed to genuinely plateau at a fixed intermediate scroll offset
regardless of how many wheel events were re-dispatched — a Firefox input-emulation limitation, not a
site scroll-jacking bug, since a direct `window.scrollTo` call reliably reaches the exact requested
offset on this site in every browser. Fixed by switching `scrollToBottom()` to
`window.scrollTo(0, document.body.scrollHeight)` plus a new, generic, polling-based
`BasePage.waitForScrollToSettle()` helper (used by both `scrollToBottom()` and
`scrollToTopManually()`) that waits for `window.scrollY` to stop changing rather than assuming any
engine applies a scroll request synchronously — no magic pixel threshold, no browser-specific branch.
Re-verified passing on chromium, firefox, and webkit for both `home-scroll.spec.ts` and the unaffected
`home.spec.ts` call site.

A further pre-existing gap (scenarios 1.3–1.6: subscription accept/empty/malformed, and the scroll-to-top
button) was closed in a later pass (2026-08-29). Scenario 1.2 (header navigation) remains intentionally
out of scope here, independently covered by the Cross-Page Navigation chunk's own suite (`nav-*.spec.ts`)
as already noted above.

`home-subscription.spec.ts` (1.3/1.4/1.5) implements the footer newsletter widget's three cases: valid
email accepted, empty email blocked, malformed email blocked. Re-verifying live ahead of generation
surfaced one genuine correction to the plan's original assumption: the success alert (`.alert-success`)
does not clear the email input immediately — both the alert's auto-hide and the input reset happen
together in the same ~1500ms `setTimeout` callback inside `static/js/subscription.js`. The valid-email
test now asserts the alert becomes visible first, waits for it to become hidden again (>1500ms), and only
then asserts the input has reset to `''`, rather than asserting the reset immediately after submission
(which would have failed deterministically). The two rejection scenarios (empty/malformed) were
re-confirmed unchanged: both are blocked by native HTML5 constraint validation (`validity.valueMissing` /
`validity.typeMismatch`) with the alert never becoming visible; no backend request occurs in any of the
three cases, consistent with the widget's already-documented client-side-only behavior.

Scenario 1.6 (scroll-to-top button appears on scroll and returns to top) was added as a second,
independent `test.describe` block inside the existing `home-scroll.spec.ts`, deliberately kept distinct
from that file's original TC26 test: 1.6 specifically clicks the `#scrollUp` arrow control (asserting its
computed `display` toggles `none` -> `block` past the reveal threshold, then that clicking it settles
`window.scrollY` back to `0`), whereas the original TC26 test deliberately never touches that button,
proving native scroll mechanics work independently of it. Both re-verified live immediately before
generation with no further corrections needed. No new Page Object methods were required for either file —
`home-subscription.spec.ts` and the 1.6 addition reuse `HomePage`/`BasePage`'s existing
`subscribeEmailInput`/`subscribeButton`/`subscribeSuccessAlert`/`subscribe()`/`scrollToTopButton`/
`scrollToBottom()`/`gotoHome()` as-is. This closes the pre-existing gap previously flagged in this
section; every scenario in `specs/home.plan.md` is now implemented under `tests/ui/home/`.

Fully planned separately: see `specs/home.plan.md`.

## 6. Account / Auth — Implemented

**Status:** Fully planned (`specs/account.plan.md`, 8 scenarios, P0–P3) and implemented across six spec
files under `tests/ui/account/` (`login.spec.ts`, `login-validation.spec.ts`, `register.spec.ts`,
`register-validation.spec.ts`, `logout.spec.ts`, `delete-account.spec.ts` — 10 tests total). Confirmed
passing across chromium, firefox, and webkit, each spec file verified individually.

Notable quirks captured during this chunk (relevant to conventions above): `/login` and `/signup` are
the only two pages confirmed so far with `data-qa` attributes on every form field, used throughout
instead of role/text locators. Submitting the "New User Signup!" mini-form with an email that's
already registered does **not** produce a distinct error page — it renders the same login-page
template at the `/signup` URL with an inline "Email Address already exist!" paragraph, which the plan
flagged explicitly so the generator didn't mistake it for a failed navigation. Logout and Delete
Account are plain-HTML-form navigations with no confirmation dialog. Because the site has no seed/
reset API, every test that registers a real account generates a unique email per run
(`SignupPage.generateTestUser()`) and deletes the account before finishing (via `/delete_account`) so
no orphaned accounts accumulate on the shared public site; `SignupPage.registerAndLogin()` was added
as a shared helper during cleanup once the same four-step registration fixture (New User Signup ->
Account Information -> Account Created -> Continue) turned up identically across four spec files.
`BasePage` gained `logoutNavLink`, `deleteAccountNavLink`, and `loggedInAsText`, since those header
elements are shared logged-in state, not specific to any one page.

One operational note for anyone re-running this suite: running all six account spec files together
(2 workers, live public site, no mocking) occasionally produces one isolated 30s timeout on a
`page.goto`/click against automationexercise.com, rotating unpredictably across chromium/firefox/
webkit and across different tests run-to-run — it always passes on an isolated re-run of just that
test, and every file has passed cleanly on its own every time. This matches concurrent real-account
create/login/delete traffic hitting a live third-party site under test-tool load, not a defect in any
given test or locator, and is not something a code fix addresses; note it if re-running the full
directory, but do not read a single red run in that mode as a regression signal on its own.

Fully planned separately: see `specs/account.plan.md`.

## 7. Product Catalog & Search — Implemented

**Status:** Fully planned (`specs/products.plan.md`, 13 scenarios, P0–P3) and implemented across six
spec files under `tests/ui/products/` (`products-listing.spec.ts`, `products-category.spec.ts`,
`products-search.spec.ts`, `products-brand.spec.ts`, `product-details.spec.ts`, `product-review.spec.ts`
— 13 tests total, `products-brand.spec.ts` now holding two). Confirmed passing across chromium,
firefox, and webkit.

Notable quirks captured during this chunk (relevant to conventions above): two new page objects were
added, `tests/pages/ProductsPage.ts` (covers both `/products` and `/brand_products/{Brand}` — same
listing template) and `tests/pages/ProductDetailsPage.ts` (covers `/product_details/{id}`), both
extending `BasePage` and matching the zero-`data-qa` role/id/class locator convention already
established on `HomePage.ts` — confirmed live neither page carries any `data-qa`/`data-testid`
attribute. Search is a plain GET (`/products?search={term}`, full page reload), not XHR; an empty
search term falls back to the default "All Products" grid rather than an empty "Searched Products"
state. The Category sidebar is a single-open Bootstrap accordion using in-page anchors
(`#Women`/`#Men`/`#Kids`, no navigation); its subcategory links (`/category_products/{id}`) are real
navigations but were kept explicitly out of scope for this chunk. Add to Cart on the product details
page IS backed by a real network call (`GET /add_to_cart/{id}?quantity={n}`, quantity reflecting
whatever was in the input at click time) and opens an in-page `#cartModal` with no navigation away. The
product review form's success alert (`#review-section`) could not be confirmed to become visible in
any exploration or generation attempt despite the form's fields reliably resetting after submission and
its required-field validation working correctly — this was deliberately left as a soft/non-asserted
observation rather than a hard pass/fail check, to avoid a false-negative-prone test; see
`specs/products.plan.md` §5 for detail. It is not currently classified as a confirmed site defect (the
lack of a network request on submission could equally be an anti-automation gate as a genuine bug) and
is flagged here for awareness rather than logged as a known finding.

One `BasePage` change came out of this chunk's cleanup pass: `BasePage.goto()` now blocks Google Ads
"vignette" interstitial network requests before navigating (`blockAdNetworks()`), because that ad
script was found to install a page-wide click hijacker on webkit specifically, rewriting the next
click's destination to `#google_vignette` regardless of the actual click target. This was reproduced
across two separate spec files (`products-listing.spec.ts`'s "View Product" link and
`products-brand.spec.ts`'s brand sidebar link) before being hoisted to `BasePage` rather than
duplicated per file, per this project's shared-pattern convention — it benefits every chunk's webkit
runs going forward, not just this one.

An audit-gap scenario (3.2, TC19 "View & Cart Brand Products") was added to `products-brand.spec.ts`
in a later pass: navigating to a brand-filtered listing (`/brand_products/Polo`), viewing one of its
products' detail page, adding it to cart with a custom quantity, and confirming the resulting cart row
(name/href/category/unit price/quantity/line total) is correct — reusing `ProductsPage`,
`ProductDetailsPage`, and `CartPage` as-is, with no new Page Object methods needed. The test is
anonymous (no account created), so it cleans up by deleting the cart item it added
(`cartPage.deleteItem(8)`) at the end rather than via an account-deletion step. Confirmed passing
across chromium, firefox, and webkit.

Fully planned separately: see `specs/products.plan.md`.

## 8. Cart — Implemented

**Status:** Fully planned (`specs/cart.plan.md`, 7 scenario groups, 9 scenarios, P0–P2) and
implemented across seven spec files under `tests/ui/cart/` (`cart-empty.spec.ts`, `cart-display.spec.ts`,
`cart-quantity.spec.ts`, `cart-delete.spec.ts`, `cart-checkout-gate.spec.ts`, `cart-subscription.spec.ts`,
`cart-search-login.spec.ts` — 9 tests total). Confirmed passing across chromium, firefox, and webkit
(21/21 for the original five files in a full run across all three projects; the two later audit-gap
files were verified together with two other chunks' audit-gap files in an 18/18 targeted run across
all three projects — see the paragraph below).

Notable quirks captured during this chunk (relevant to conventions above): a new `tests/pages/CartPage.ts`
was added, extending `BasePage` and reusing the existing `tests/pages/ProductDetailsPage.ts` for all
add-to-cart test setup rather than reinventing it — `ProductDetailsPage` gained a shared
`addToCartAndViewCart()` helper once the same "set quantity, add to cart, wait for `#cartModal`, click
View Cart" sequence turned up identically across every cart spec file. `/view_cart`'s `<title>` reads
"Automation Exercise - Checkout" at all times, even when just viewing the cart or with the checkout
modal closed — never used title to distinguish cart-view vs. checkout state, per the quirk already
flagged during the Product Catalog chunk. Cart quantity is a static, non-editable `<button>` (not an
`<input>`), confirmed to carry no HTML `disabled` attribute yet produce no state change on click — this
is not a defect, it's simply that quantity editing isn't implemented in the cart UI. No cart-wide/grand
total is ever rendered, only per-row line totals. Item removal (`GET /delete_cart/{id}`) and Add to Cart
are both real backed network calls, but "Proceed to Checkout" is purely a client-side Bootstrap modal
toggle (`#checkoutModal`) with no backend request at all when not logged in — confirmed via
`browser_network_requests`. One isolated 30s timeout occurred on firefox for
`cart-checkout-gate.spec.ts` during the full-suite run (modal never became visible within the timeout)
but passed cleanly on an immediate isolated re-run — matches the same live-site-under-load flake pattern
already documented for the Account/Auth chunk, not a code or locator defect.

Two audit-gap scenario groups were added in a later pass, closing gaps found against
AutomationExercise's official Test Cases list. Section 6 (6.1, TC11) — `cart-subscription.spec.ts` —
confirms the footer Subscription widget on `/view_cart` is the literal same shared component already
fully covered by `specs/home.plan.md`'s own widget tests (identical `#susbscribe_email`/`#subscribe`
ids, identical client-side-only behavior, no backend `/subscribe` request), adding one smoke-level
scenario confirming it also works on this page rather than duplicating Home's edge-case matrix.
Section 7 (7.1, TC20) — `cart-search-login.spec.ts` — is P0: it registers a disposable account, logs
out, searches and adds a product to the cart as a genuine anonymous/guest user, logs back in via the
header-nav login path (`/login` -> `LoginPage.loginWithCredentials`, a distinct code path from the
cart's own `#checkoutModal` login link already covered by `cart-checkout-gate.spec.ts`), and confirms
the item added anonymously survived the login boundary intact in the merged cart — then deletes the
disposable account (`deleteAccountNavLink`) while that merged cart still holds the item, confirming
account deletion isn't blocked by live cart contents. This file creates and deletes a real account, so
it correctly belongs in the mutating-suite CI bucket; `.github/workflows/playwright.yml` already runs
the entire `tests/ui/cart` directory in its `mutating-suite` job (not filtered by individual file), so
this new file is already covered with no workflow change needed — confirmed by inspection of the
workflow's run command.

`cart-search-login.spec.ts` showed a firefox-only failure during this pass with a different symptom
each time it was observed failing (in this pass: a "View Product" click not resulting in the expected
`/product_details/{id}` navigation, while running concurrently alongside another spec file) — an
isolated single-file re-run on firefox immediately passed cleanly. This matches the same
live-site-under-concurrent-load flake pattern already documented for the Account/Auth, Cart
(`cart-checkout-gate.spec.ts`), Cross-Page Navigation, and Informational Pages chunks; no code or
locator defect was found or changed.

Fully planned separately: see `specs/cart.plan.md`.

## 9. Checkout / Orders — Implemented

**Status:** Fully planned (`specs/checkout.plan.md`, 3 scenarios, P0/P0/P2) and implemented across
three spec files under `tests/ui/checkout/` (`checkout-happy-path.spec.ts`, `checkout-login-gate.spec.ts`,
`checkout-payment-validation.spec.ts` — 3 tests total). Confirmed passing across chromium, firefox, and
webkit (9/9 in a full run across all three projects).

Notable quirks captured during this chunk (relevant to conventions above): a new
`tests/pages/CheckoutPage.ts` was added, extending `BasePage` and composing `CartPage`/`LoginPage`/
`SignupPage` rather than redeclaring their locators (the login-gate modal, the New User Signup
mini-form, the Account Information form, and the Delete Account cleanup pattern). `/checkout`'s only
`data-qa` attribute is on the wrapping address-details `div`; the review table, comment box, and Place
Order link carry none — a sharp contrast with `/payment`, where every field and the Pay button carry
`data-qa`, confirming attribute coverage must be checked per-page within a single flow rather than
assumed to carry over from a sibling step. "Place Order" and "Proceed To Checkout" share the exact same
`a.check_out` CSS class and must be disambiguated by `href`, since they never coexist on the same page.
Submitting payment fires a real `POST /payment` (302) followed by `GET /payment_done/{orderId}` (200)
— a genuine backend call that creates a real order record, unlike the Cart chunk's purely client-side
login-gate modal — though per project scope only the resulting client-side flow/order record is
asserted, never payment-gateway correctness. "Download Invoice" triggers a real file download
(`GET /download_invoice/{id}`, `content-disposition: attachment; filename=invoice.txt`) whose exact
text content follows the literal template `Hi {FirstName} {LastName}, Your total purchase amount is
{total}. Thank you`. Account deletion was confirmed to work identically whether or not a real order was
placed under that account first, so no scenario here strands an orphaned account or order.

Two chromium-only failures surfaced during verification (both `CartPage.clickProceedToCheckout()` and
`CheckoutPage.proceedToCheckoutFromCart()` timing out waiting for the post-click state to render) and
were addressed with a scroll-into-view + single bounded re-click before falling through to the
original full-timeout wait, on the working hypothesis of a transient overlay occasionally swallowing
the first click on chromium — this hypothesis was not independently re-confirmed live after an
interrupted healing session, so it is documented as a working hypothesis in the page-object comments,
not an confirmed root cause; the fix itself is safe regardless, since a genuine failure still surfaces
via the unchanged full-timeout fallback. A separate, fully-diagnosed firefox-only failure was also
fixed: `CheckoutPage.getAddressText()`'s line filter compared against title-case `'Your '`, which
missed Firefox's rendered `innerText` coming back upper-cased for the address-section heading (a
cross-browser `innerText`/CSS-`text-transform` rendering difference, not a site defect) — the filter is
now case-insensitive.

A CI-only (GitHub Actions, Ubuntu headless) failure surfaced after this chunk's original local
verification: `checkout-happy-path.spec.ts`'s invoice-download step (`CheckoutPage.downloadInvoice()`)
hit the test's default 30s timeout on WebKit only, twice (original + retry), while chromium/firefox and
the rest of the suite passed (104/105). This was **initially misdiagnosed as a CI-environment timing
characteristic** (headless WebKit on Linux CI assumed to just be slower to fire Playwright's native
`download` event) and "fixed" by raising `waitForEvent('download')` to a 45s timeout plus the test's own
timeout to 60s. **That fix did not hold**: a second real CI run hit the full 45000ms timeout with zero
occurrence of the `download` event, twice (original + retry1) — proving this was never a timing issue.
The native `download` event genuinely never fires for this interaction on Playwright's Linux/WebKit
build in GitHub Actions, even though it fires fine on a local Windows WebKit build, consistent with
Playwright's WebKit builds differing meaningfully by OS (Linux uses a different underlying engine build
than Windows/macOS) and browser-download-manager support being a known gap area on Linux WebKit
specifically. No amount of additional timeout would have fixed this.

**Corrected fix:** the verification for this one step no longer depends on any browser's native
download event or download manager at all. `CheckoutPage.downloadInvoice(orderId)` now clicks "Download
Invoice" and captures the resulting `GET /download_invoice/{orderId}` response via
`page.waitForResponse()`, asserting status (200) and the `content-disposition` header directly.
Reading that same response's *body* turned out to have its own, broader cross-browser gap surfaced
during this fix's own local verification: once a response is classified by the browser as a download,
its body becomes unreadable via the normal `Response` object on more than just WebKit — chromium throws
immediately (`"Response body is not available for a response that was navigated away from"`), webkit
hangs until the test timeout, and only firefox happened to still expose it. A new
`CheckoutPage.fetchInvoiceText(orderId)` method re-fetches the same URL independently via
`page.request` (an `APIRequestContext` sharing the page's authenticated session cookies) — a plain HTTP
request never handed to any browser download manager, so its body is reliably readable on all three
browsers. `test.setTimeout()` was reduced from 60s to 45s (a general safety margin for this flow's
several real network round-trips, no longer justified by the download step specifically, which no
longer waits on anything that can silently never resolve), and `acceptDownloads: true` was kept in
`playwright.config.ts` as a defensive default for the click itself rather than because any assertion
still depends on it. Re-verified locally in a single full run across chromium, firefox, and webkit (one
real order per browser): all three passed (max 21.2s, well under the 45s budget).

**Follow-up (third round, real CI):** the response-capture fix above is now **CONFIRMED WORKING** —
a subsequent real CI run showed zero errors anywhere in the download/invoice-fetch portion of this
test, on every browser. That same run surfaced a *different*, later, deterministic failure (identical
on both original and retry1, i.e. confirmed non-flaky) at the plan's step 5 final assertion: "the page
URL remains unchanged at `/payment_done/{n}` after the click — no navigation occurs from downloading
the invoice." On WebKit specifically, clicking "Download Invoice" (`a[href^="/download_invoice"]`,
confirmed to carry no HTML5 `download` attribute — it relies entirely on the server's
`Content-Disposition: attachment` response header to divert the click into a download rather than a
navigation) actually navigates the page to `/download_invoice/{n}`, rather than the navigation being
suppressed as it is on chromium/firefox. This was never seen during this chunk's original local
verification because the local WebKit build (Windows) does not share this behavior — only the Linux
WebKit build used in real CI does; this is now confirmed a genuine, deterministic, browser-specific
behavior difference, not a timing/mechanism issue and not something a capture-mechanism trick can paper
over, since the underlying premise (no navigation occurs) is simply false on that browser.

**Corrected assertion — revised once more after local re-verification below:** an initial fix branched
on `test.info().project.name === 'webkit'` and asserted the navigated-to-`/download_invoice/{id}`
outcome unconditionally for that project. That fix immediately failed on this machine's own local
webkit run — with the exact opposite outcome (`/payment_done/{id}`, no navigation) — confirming what
the CI-only failure already implied: the divergence tracks the WebKit *build* (Linux CI vs. local
Windows), not the "webkit" project name itself, so a single hardcoded expectation for that project is
wrong on at least one of the two builds. The assertion was corrected again to accept **either**
confirmed-valid outcome on the webkit project (`/payment_done/{id}` OR `/download_invoice/{id}`) rather
than asserting one unconditionally, then — only if the navigated-away outcome occurred — recovers via
`checkoutPage.goto('/payment_done/{orderId}')` before continuing into the shared "Continue" / Delete
Account steps, so the rest of the flow runs identically regardless of which outcome occurred. On
chromium/firefox the original "stays on `/payment_done/{orderId}`" assertion is unchanged, since it
still holds unconditionally there. The invoice content assertion itself (`fetchInvoiceText()`, a plain
`page.request` call against the same URL/session) is unaffected by whether the page itself navigated,
so it continues to run and assert identically on all three browsers regardless of this branch.
Re-verified with a single targeted webkit-only run (one real order, per this project's live-site volume
discipline) — green, exercising the "stayed on `/payment_done/{id}`" branch on this machine's (Windows)
WebKit build, with the "navigated to `/download_invoice/{id}`" branch confirmed correct by construction
from the real CI failure output rather than re-triggered locally (this machine's WebKit build cannot
produce it) — plus a chromium sanity check since the changed code path is shared: also green.

A brief, appropriately-hedged note for future reference: forcing an HTML5 `download` attribute
client-side on this link (a one-line addition the site itself doesn't make) would very likely make this
navigate-vs-download behavior deterministic across all browsers regardless of how each one currently
interprets the `Content-Disposition` header — noted here as a plausible root cause explanation, not
escalated to `README.md`, since this project doesn't control automationexercise.com's markup and the
current test-side handling is a normal, low-risk cross-browser behavior difference rather than a
mislabeled/broken/invalid-HTML site defect.

Fully planned separately: see `specs/checkout.plan.md`.

## 10. Contact Us — Implemented

**Status:** Fully planned (`specs/contact.plan.md`, 4 scenarios, P2/P3) and implemented across two
spec files under `tests/ui/contact/` (`contact-submit.spec.ts`, `contact-validation.spec.ts` — 4
tests total). Confirmed passing across chromium, firefox, and webkit (12/12 in a full run across all
three projects).

Notable quirks captured during this chunk (relevant to conventions above): a new
`tests/pages/ContactUsPage.ts` was added, extending `BasePage`. All five requested `data-qa` values
were confirmed live on every field except the file upload input (`name="upload_file"`, no `data-qa`
attribute at all — scoped instead via `input[type="file"]` under `#contact-us-form`), consistent with
the project convention of checking attribute coverage per page rather than assuming it. Email is the
only required field (and the only one with `type="email"`); Name/Subject/Message carry no
required/maxlength/minlength constraints. Clicking Submit on a form that already passes client-side
validation triggers a native `window.confirm()` dialog reading exactly "Press OK to proceed!" *before*
the real POST fires — every scenario that reaches this point registers a dialog handler first, since an
unhandled dialog hangs the test indefinitely. A verification-time defect was caught and healed: the
`.status.alert.alert-success` success-alert div is present in the DOM at all times (hidden via inline
`style="display: none"`), never inserted/removed — the two scenarios that never submit (empty-required-
field block, dialog-decline) initially asserted its absence via `toHaveCount(0)`, which failed
deterministically (not flakily) on all three browsers; corrected to assert non-visibility
(`not.toBeVisible()`) instead, which is the only assertion this project's convention endorses for an
element whose hidden-vs-visible state — not DOM presence — is what actually changes. On a real accepted
submission, `#contact-us-form` is fully replaced (not merely hidden) by the success alert (exact text
"Success! Your details have been submitted successfully.") and a "Home" link (`href="/"`). Declining the
confirm() dialog leaves the form and its entered values completely unchanged. Exactly ONE scenario (the
happy path) performs a real, accepted submission against the live site — the other three scenarios
(required-field block, invalid-email-format block, dialog-decline) are all confirmed to never reach the
backend, consistent with this project's live-site volume discipline. The file-upload field uses a
dedicated, trivial fixture (`tests/fixtures/contact-upload.txt`, a one-line placeholder with no
personal/sensitive content) rather than any arbitrary local file, per this project's file-upload
guardrail. A cleanup pass added `ContactUsPage.captureDialogMessages()`, a shared dialog-message-capture
helper, once the identical raw `page.once('dialog', ...)` capture pattern turned up duplicated across
both spec files.

Fully planned separately: see `specs/contact.plan.md`.

## 11. API Test Track — Implemented

**Status:** Fully planned (`specs/api.plan.md`, 10 scenarios, P0–P2) and implemented across five spec
files under `tests/api/` (`products.spec.ts`, `brands.spec.ts`, `search.spec.ts`, `login.spec.ts`,
`account.spec.ts` — 12 tests total). Confirmed passing across chromium, firefox, and webkit (48/48 in a
full run across all three projects).

Notable quirks captured during this chunk (relevant to conventions above): every single endpoint on
this API returns raw HTTP transport status 200 regardless of semantic outcome — success, missing
parameters, unsupported methods, and not-found lookups are all distinguished only by a `responseCode`
field inside the JSON body (200/201 success, 400 bad request, 404 not found, 405 method not supported),
never by `response.ok()`, which is true in every case including documented error paths. This matches
the pattern already established in `products.spec.ts`/`brands.spec.ts`. `POST /api/verifyLogin` returns
the identical `responseCode: 400` / message text regardless of whether `email` or `password` is the
missing parameter (the API does not distinguish which field was omitted), and returns a distinct
`responseCode: 404`/`"User not found!"` for a real email with a wrong password — confirmed as three
genuinely distinct outcomes (200 valid / 400 missing-param / 404 wrong-password), not variations of the
same error. `POST /api/createAccount`'s error message names the specific missing field (e.g. "email
parameter is missing"), unlike `verifyLogin`'s generic missing-param message. `GET /api/getUserDetailByEmail`
response field names differ from the create/update request field names (`first_name`/`last_name`/
`birth_day` in the response vs. `firstname`/`lastname`/`birth_date` in the request) — this was confirmed
live and asserted explicitly rather than assumed to match. No `updateProduct` or equivalent
product-mutation endpoint is documented on `/api_list` beyond the already-covered POST-not-supported
case on `productsList` and PUT-not-supported case on `brandsList`; the plan's speculative "updateProduct"
line item was dropped as inapplicable once live exploration confirmed it isn't a real documented
endpoint. Every scenario that calls `createAccount` generates a unique synthetic email per run and
deletes the fixture account by the end of the same test (`try`/`finally`, or the delete step doubling as
the test's own assertion), so no orphaned accounts accumulate on the shared public site — mirroring the
same discipline already established in the Account/Auth chunk. A cleanup pass hoisted the identical
`generateFixtureAccount()` helper (which had turned up duplicated verbatim in both `login.spec.ts` and
`account.spec.ts`) into a shared `tests/api/testData.ts` module, the API track's equivalent of
`SignupPage.generateTestUser()` for the UI suite.

Fully planned separately: see `specs/api.plan.md`.

## 12. Cross-Page Navigation — Implemented

**Status:** Fully planned (`specs/navigation.plan.md`, 7 scenarios, P0/P0/P1/P1/P1/P2/P2) and
implemented across seven spec files under `tests/ui/navigation/` (`nav-internal-links.spec.ts`,
`nav-external-link.spec.ts`, `nav-cross-page-presence.spec.ts`, `nav-gated-flow-presence.spec.ts`,
`nav-browser-back.spec.ts`, `nav-reclick.spec.ts`, `nav-auth-state.spec.ts` — 7 tests total). Confirmed
passing across chromium, firefox, and webkit (21/21 in a full run across all three projects, with one
test individually re-fixed and re-confirmed afterward — see quirk below).

Notable quirks captured during this chunk (relevant to conventions above): no new Page Object class was
needed — every scenario reuses `HomePage`/`ProductsPage`/`CartPage`/`LoginPage`/`SignupPage`/
`CheckoutPage`/`ContactUsPage`, all of which already extend `BasePage`. Two small generic helpers were
added to `BasePage.ts`: `getHref(link)` (read a nav link's `href` without clicking it — used to verify
the Video Tutorials external link is never followed) and `clickNavAndExpectUrl(link, expectedUrlPattern)`
(centralizes the `Promise.all([page.waitForURL(...), link.click()])` pattern shared by every
internal-link and cross-page-presence check, instead of duplicating it per spec file). The header nav
bar was confirmed live to be uniform across every page checked, including the two deepest gated pages
(`/checkout`, `/payment`) reached via a real logged-in add-to-cart → checkout → payment flow — no
absence/difference was found anywhere. The Video Tutorials link is a same-tab external link with no
`target`/`rel` attribute at all (not a new-tab link as might be assumed), so it is verified via `href`
value only, never clicked. The Signup/Login nav item is fully replaced by three separate items once
logged in (`Logout`, `Delete Account`, `Logged in as {name}`), and Delete Account both removes the
account and ends the session in the same action, reverting the nav to its logged-out state with no
separate logout step needed. Browser back-navigation (`page.goBack()`) was confirmed clean for all 8
header links (all are plain `<a href>` full-page GET navigations, not client-side route changes), spot-
checked on one representative multi-hop chain rather than all 8 individually, per equivalence
partitioning. Of the 7 files, `nav-auth-state.spec.ts` and `nav-gated-flow-presence.spec.ts` are the only
two that create (and delete) a real disposable account, matching `SignupPage.generateTestUser()`'s
pattern; the other 5 are pure read-only navigation/presence checks with no account or order creation.

One test-design issue was found and healed: `nav-internal-links.spec.ts` performs 13 sequential
full-page navigations against the live site in a single test (the heaviest file in this suite by a wide
margin) and was intermittently hitting the default 30s test-level timeout partway through the sequence,
reproducing 3/3 times on an isolated firefox-only run before the fix (chromium/webkit had passed
reliably at that point). `test.setTimeout(90_000)` was added, scoped to just this one test, and an
isolated single-test/single-project re-run on firefox confirmed the fix (32.9s, well within budget).
Separately, when this same file was re-run concurrently alongside other tests under this project's
standard 2-worker setting, occasional 30s-class timeouts on `page.goto` resurfaced across all three
browsers, not just firefox — this matches the same live-site-under-concurrent-load flake pattern
already documented for the Account/Auth and Cart chunks (occasional timeout, always clears on a true
isolated single-test re-run, not a locator/code defect), simply more exposed here due to this file's
unusually high navigation volume per test. No further code change was made for that pattern, consistent
with how the same pattern was handled in the Account/Auth and Cart chunks.

Fully planned separately: see `specs/navigation.plan.md`.

## 13. Informational Pages — Implemented

**Status:** Fully planned (`specs/informational.plan.md`, 4 scenarios, all P3) and implemented across
two spec files under `tests/ui/informational/` (`test-cases.spec.ts`, `api-list.spec.ts` — 4 tests
total). Confirmed passing across chromium, firefox, and webkit (12/12, verified via one full run plus
one isolated re-run of two firefox goto timeouts and one webkit click-instability failure, all three of
which cleared cleanly on isolated re-run — see quirk below).

Notable quirks captured during this chunk (relevant to conventions above): a new
`tests/pages/InformationalPage.ts` was added, extending `BasePage` and reusing its existing
`testCasesNavLink`/`apiTestingNavLink` header locators rather than redeclaring them. One shared,
parameterized Page Object (not two separate classes) covers both `/test_cases` and `/api_list`, mirroring
the same precedent already established by `ProductsPage.ts` covering both `/products` and
`/brand_products/{Brand}` — live exploration confirmed both pages render from the literal same
Bootstrap-accordion template, differing only in heading text, intro sentence, and item count (26 vs 14).
Neither page carries any `data-qa`/`data-testid` attribute, consistent with Home/Products/Cart's
already-documented zero-`data-qa` pattern rather than Login/Signup/Contact's. The plan's original
assumption — that a collapsed accordion header link's own `class` attribute equals `'collapsed'` — did
not hold live: both pages' `<a data-toggle="collapse">` elements always carry a null/empty `class`
attribute; the actual collapsed/expanded marker lives entirely on the corresponding `#collapseN` panel
`<div>` itself (`class="panel-collapse collapse"` vs `"panel-collapse in"`, matching computed `display`),
so `InformationalPage.isAccordionItemCollapsed()` reads the panel's class instead of the link's — a
generator-caught correction to the plan's assumption, not a site defect. Both pages are entirely
client-side: expanding/collapsing an accordion item produces zero requests to any
`automationexercise.com` endpoint. Accordion items on both pages are NOT a single-open group — each
panel toggles independently, confirmed by expanding two items simultaneously and observing both remain
visible at once; a second click on an already-open item's header collapses it again (plain toggle, not a
one-shot reveal). Per this chunk's deliberately light-coverage mandate, only a representative 2-3 items
per page are exercised for expand/collapse behavior (not all 26 Test Cases or all 14 API entries), plus
a page-load/link-count/collapsed-by-default smoke check across every item's count and a first/middle/
last spot-check — consistent with the strategy's "smoke checks only, not full interaction testing"
scope. The `Feedback for Us` `mailto:` link present at the bottom of both pages is verified via its
`href` attribute only, never clicked, per this project's scope discipline around not dispatching real
external actions. One full-run flake surfaced during verification — two firefox `page.goto` timeouts
plus one webkit accordion-click "element is not stable" failure, all on `api-list.spec.ts` — and all
three cleared cleanly on an isolated re-run of just that file, matching the same live-site-under-
concurrent-load flake pattern already documented for the Account/Auth, Cart, and Cross-Page Navigation
chunks; no code or locator defect was found or changed.

Fully planned separately: see `specs/informational.plan.md`.

## 14. Next Steps

All nine chunks defined in this strategy (§2/§3) are now implemented: Home Page, Account/Auth, Product
Catalog & Search, Cart, Checkout/Orders, API Test Track, Contact Us, Cross-Page Navigation, and
Informational Pages. There is no remaining chunk in this document's scope to plan or build next. Future
work under this strategy would only be re-triggered by the application itself changing materially (a new
feature/page added to the live site) or a maintenance need surfacing in an already-implemented chunk
(a healed regression, a new shared Page Object helper, or a CI bucket re-check if a chunk's read-only/
mutating character changes), not by any further "next chunk" in this priority order.

## 15. Mobile Viewport Coverage (added 2026-08-30)

A senior-engineer review of this suite (2026-08-30) found the config had two mobile device projects
(Pixel 5 / Mobile Chrome, iPhone 12 / Mobile Safari) commented out in `playwright.config.ts` — zero
mobile/responsive coverage existed prior to this. Both projects are now enabled.

**Deliberately scoped light for this first pass**, mirroring how the Informational Pages chunk started
light: only the read-only core-journey files run on mobile — `tests/ui/home/**`, `tests/ui/products/**`,
and the read-only slice of `tests/ui/cart/**` (`cart-empty`, `cart-display`, `cart-quantity`,
`cart-delete`, `cart-checkout-gate`, `cart-subscription` — excludes `cart-search-login.spec.ts`, which
creates a real account, kept off an unproven device profile for now). Checkout/Account are not run on
mobile at all yet.

Verified locally before enabling in CI: **54/54 passed** (27 tests × 2 device projects, zero healing
needed) — the site's Bootstrap-based layout and this suite's role/id/class-based locators held up on
both mobile viewports with no mobile-specific breakage found. Wired into
`.github/workflows/playwright.yml` as a new `mobile-smoke` job, gated to schedule/`workflow_dispatch`
only (same as `mutating-suite`) rather than every push/PR — both to keep CI runtime sane while this is a
new, less-proven dimension, and to avoid running any account-touching semantics on it without a
deliberate future decision to do so.

**Not yet covered**: Checkout, Account/Auth, and TC20's `cart-search-login.spec.ts` on mobile; expanding
`mobile-smoke`'s scope to these is a natural next step once this first pass has run cleanly on real CI
a few times.
