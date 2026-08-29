# Cross-Page Navigation Test Plan

## Application Overview

## Scope

This is Chunk 9 ("Cross-Page Navigation") of the AutomationExercise E2E suite, per `specs/test-plan.md` §2/§12. It is planned and built LAST because it composes every other chunk's Page Object (`HomePage`, `ProductsPage`, `CartPage`, `LoginPage`, `SignupPage`, `CheckoutPage`, `ContactUsPage`), all of which already exist and are implemented/passing.

**This suite tests the navigation CONTRACT only** — does each of the 8 primary header nav links (`Home`, `Products`, `Cart`, `Signup / Login`, `Test Cases`, `API Testing`, `Video Tutorials`, `Contact us`) land on its correct destination, does the nav bar remain present/correct across every kind of page (shallow and deep-gated), and does back-navigation (browser back, or re-clicking a nav item) return cleanly. It deliberately does NOT re-test any destination page's own internals (form validation, product listing behavior, cart math, checkout steps, etc.) — those are owned by their own chunk's plan/spec files (`specs/home.plan.md`, `specs/account.plan.md`, `specs/products.plan.md`, `specs/cart.plan.md`, `specs/checkout.plan.md`, `specs/contact.plan.md`). Assertions here are intentionally shallow: destination URL, destination page's already-established heading/title, and nav-bar element presence/href — never "does this destination's form/logic work correctly."

**Existing coverage check:** no `specs/navigation.plan.md` or `tests/ui/navigation/**` existed prior to this plan (confirmed via Glob). Individual chunk plans (`home.plan.md` etc.) each briefly touch their OWN page's nav locators as setup, but none of them walk the full 8-link contract end-to-end or test back-navigation/deep-page nav presence — that cross-cutting concern is new and owned entirely by this plan.

## Page Object status

- **`tests/pages/BasePage.ts` — existing, reused as-is for all 8 nav locators** (`homeNavLink`, `productsNavLink`, `cartNavLink`, `signupLoginNavLink`, `testCasesNavLink`, `apiTestingNavLink`, `videoTutorialsNavLink`, `contactUsNavLink`, plus logged-in-state `logoutNavLink`/`deleteAccountNavLink`/`loggedInAsText`). No new Page Object class is needed for this chunk — every scenario below instantiates whichever existing concrete Page Object matches its starting page (`HomePage`, `ProductsPage`, `CartPage`, `LoginPage`, `SignupPage`, `CheckoutPage`, `ContactUsPage`), all of which already extend `BasePage` and inherit these locators for free.
- **`BasePage.ts` — TWO small additions needed during generation** (nav-level generic helpers, not specific to any one destination page):
  1. `async getHref(link: Locator): Promise<string | null>` — a generic attribute getter, needed to assert the Video Tutorials link's `href` value without ever clicking it (see Scenario 2).
  2. `async clickNavAndExpectUrl(link: Locator, expectedUrlPattern: RegExp)` — a generic "click a nav item, then wait for the URL to match" helper (`Promise.all([page.waitForURL(expectedUrlPattern), link.click()])`), to avoid duplicating this exact pattern across the 7 internal-link checks in Scenario 1 and the cross-page-presence checks in Scenario 3.
- No other page object changes are anticipated. All navigation in generated tests must go through a Page Object's `goto()`/`gotoX()` (never raw `page.goto()`), per the project's confirmed `blockAdNetworks()` webkit click-hijack workaround already centralized in `BasePage.goto()`.

## Live findings confirmed during this planning pass

1. **Nav bar is uniform across every page checked — no absence or difference found anywhere**, including the two deep-gated pages this plan specifically checked: `/checkout` and `/payment` (both reached via a real logged-in add-to-cart → checkout → payment flow). All 8 static items render identically on Home, Products, Cart, Login, Checkout, and Payment. This contradicts nothing in the task brief but is now a CONFIRMED fact rather than an assumption — do not write a scenario asserting the nav is absent/different anywhere; instead assert it is IDENTICALLY present everywhere checked.
2. **Video Tutorials is a same-tab external link, NOT an `target="_blank"` new-tab link.** Confirmed live: `href="https://www.youtube.com/c/AutomationExercise"`, no `target` attribute and no `rel` attribute at all. Because it has no new-tab target, clicking it would navigate the SAME browser tab away from automationexercise.com and into YouTube's own UI — out of scope per this project's guardrails and per `specs/test-plan.md`'s stated scope ("only the link target is verified, not YouTube's own UI"). The plan below therefore asserts the `href` ATTRIBUTE VALUE only, via `BasePage.getHref()`, and never calls `.click()` on this link.
3. **Signup/Login nav item's label/destination changes completely once logged in** — confirmed live via a real disposable-account registration: the single "Signup / Login" nav item (`href="/login"`) is REPLACED by three separate items: `Logout` (a real link, logs the session out and redirects to `/login`), `Delete Account` (a real link to `/delete_account`, requires an active session — confirmed it works via direct navigation while logged in), and a non-interactive `Logged in as {name}` text node. Confirmed also: successfully deleting the account (`/delete_account`) both permanently deletes it AND ends the session in the same action — after deletion, the nav immediately reverts to the logged-out "Signup / Login" state with no separate logout step needed. Any scenario touching this state must, per project convention, generate a unique synthetic email (matching `SignupPage.generateTestUser()`'s pattern) and end with account deletion.
4. **Back-navigation is clean for the plain full-page navigations this suite covers.** Confirmed live: navigating Home → Products → browser back() returns to `/`, fully rendered, with no re-submission dialog, no stale content, and no console errors introduced by the back navigation itself. All 8 header nav links are simple `<a href>` full-page GET navigations (confirmed via DOM inspection, not client-side route changes), so browser back is expected to behave uniformly for all of them — this was spot-checked on one representative pair (Products → Home) rather than all 8, per equivalence partitioning (they share the identical navigation mechanism).
5. **Destination pages' distinguishing content used for shallow verification** (URL + one already-stable signal per project convention, never full content checks):
   - Home (`/`): existing `HomePage.featuresItemsHeading` ("Features Items") — already an established locator.
   - Products (`/products`): title `"Automation Exercise - All Products"`; existing `ProductsPage.allProductsHeading`.
   - Cart (`/view_cart`): title is ALWAYS `"Automation Exercise - Checkout"` (confirmed pre-existing quirk, do not use title here) — use URL plus existing `CartPage`'s established cart-table/empty-cart state instead.
   - Signup/Login (`/login`): existing `LoginPage.loginHeading` ("Login to your account").
   - Test Cases (`/test_cases`): title `"Automation Practice Website for UI Testing - Test Cases"` (confirmed live; no dedicated Page Object exists yet for this page — Chunk 7 "Informational Pages" is not yet planned — so this suite asserts URL + title only, via plain Playwright assertions, not a new Page Object method).
   - API Testing (`/api_list`): title `"Automation Practice for API Testing"` (confirmed live, same no-dedicated-Page-Object caveat as above).
   - Contact us (`/contact_us`): existing `ContactUsPage.getInTouchHeading` ("Get In Touch").
6. **Network backing:** all 8 nav links are plain server-rendered full-page navigations (`<a href>`, confirmed via DOM inspection) — none are XHR/fetch-backed SPA route changes. No API-level test coverage applies to this chunk; it is a pure UI/DOM navigation-contract suite.

## Test data / cleanup

Only ONE scenario in this plan (Scenario 7, "Authenticated nav state transitions") touches account creation, per the constraint that this chunk is otherwise read-only. It generates a unique synthetic email via the same pattern as `SignupPage.generateTestUser()` and ends with a real account deletion (`Delete Account`) before the test completes — no orphaned account is left on the shared public site. Scenario 4 ("Deep gated-flow nav presence") also creates and deletes one disposable account, since reaching `/checkout`/`/payment` requires being logged in with at least one cart item; it follows the identical cleanup discipline.

## Priority rationale

- **P0**: the two scenarios that ARE the core deliverable of this chunk — every internal link lands correctly, and the nav bar survives the deepest, most state-dependent part of the site (the login-gated checkout/payment flow) without disappearing or breaking. If either fails, the nav "contract" itself is broken.
- **P1**: back-navigation and cross-page presence on shallow (non-gated) pages — high-value regression net, but a failure here is less severe than a broken forward-navigation link since users can usually still reach content another way.
- **P2**: the external Video Tutorials link check and the authenticated nav-state-swap scenario — genuinely useful but lower blast-radius (an external link or a label-swap defect is cosmetic/minor compared to a broken internal destination).

## Suite-to-scenario map

| # | Scenario | Priority | Suite file |
|---|---|---|---|
| 1 | Internal header nav links navigate to correct destinations | P0 | `tests/ui/navigation/nav-internal-links.spec.ts` |
| 2 | Video Tutorials nav link points to the correct external destination without navigating away | P2 | `tests/ui/navigation/nav-external-link.spec.ts` |
| 3 | Header nav bar is present and identical across shallow (non-gated) pages | P1 | `tests/ui/navigation/nav-cross-page-presence.spec.ts` |
| 4 | Header nav bar remains present and correct through the deepest gated flow (Checkout, Payment) | P0 | `tests/ui/navigation/nav-gated-flow-presence.spec.ts` |
| 5 | Browser back-navigation after following a nav link returns cleanly | P1 | `tests/ui/navigation/nav-browser-back.spec.ts` |
| 6 | Returning to a prior page via the nav bar itself (re-click, not browser back) renders correctly | P1 | `tests/ui/navigation/nav-reclick.spec.ts` |
| 7 | Authenticated nav state transitions (Signup/Login ⇄ Logout/Delete Account/Logged-in-as) | P2 | `tests/ui/navigation/nav-auth-state.spec.ts` |


## Test Scenarios

### 1. Static Header Nav Contract

**Seed:** `tests/seed.spec.ts`

#### 1.1. [P0] Internal header nav links navigate to their correct destinations

**File:** `tests/ui/navigation/nav-internal-links.spec.ts`

**Steps:**
  1. Assume a fresh, unauthenticated browser context. Instantiate `HomePage` and navigate to `/` via `homePage.gotoHome()`.
    - expect: Page URL is exactly the baseURL root ('/'), and `homePage.featuresItemsHeading` ('Features Items') is visible, confirming the starting state before any nav click.
  2. For EACH of the following 7 internal nav links in turn (decision table — one sub-case per row; each sub-case starts fresh from Home again via `homePage.gotoHome()` so sub-cases are independent): (a) Products -> `homeNavLink`'s sibling `productsNavLink`, expected URL `/products`, expected signal: title contains 'All Products' AND `ProductsPage.allProductsHeading` visible. (b) Cart -> `cartNavLink`, expected URL `/view_cart`, expected signal: `CartPage`'s cart table OR empty-cart message becomes visible (whichever the current cart state renders — this suite does not care which, only that ONE of the two mutually exclusive states renders, confirming a real landing rather than a blank/broken page). (c) Signup/Login -> `signupLoginNavLink`, expected URL `/login`, expected signal: `LoginPage.loginHeading` ('Login to your account') visible. (d) Test Cases -> `testCasesNavLink`, expected URL `/test_cases`, expected signal: `page.title()` equals exactly 'Automation Practice Website for UI Testing - Test Cases'. (e) API Testing -> `apiTestingNavLink`, expected URL `/api_list`, expected signal: `page.title()` equals exactly 'Automation Practice for API Testing'. (f) Contact us -> `contactUsNavLink`, expected URL `/contact_us`, expected signal: `ContactUsPage.getInTouchHeading` ('Get In Touch') visible. (g) Home -> `homeNavLink` clicked from a DIFFERENT page (e.g. immediately after the Products sub-case, before returning Home again), expected URL `/`, expected signal: `HomePage.featuresItemsHeading` visible. For each sub-case, click the nav link (ideally via the new `BasePage.clickNavAndExpectUrl(link, expectedUrlPattern)` helper) and capture the resulting URL and the page-specific signal.
    - expect: For every one of the 7 sub-cases, the resulting page URL exactly matches that row's expected path, AND that row's specific signal (heading visible, or title equals the exact expected string, or one of the two mutually-exclusive cart states visible) is true. A failure on ANY single row (wrong URL, wrong title, or the expected signal never becoming visible/true within a reasonable wait) fails that row specifically — do not let one row's failure prevent the others from being checked/reported.

#### 1.2. [P2] Video Tutorials nav link points at the correct external destination and is never followed

**File:** `tests/ui/navigation/nav-external-link.spec.ts`

**Steps:**
  1. Assume a fresh, unauthenticated context. Instantiate `HomePage`, navigate to `/` via `gotoHome()`. Locate `videoTutorialsNavLink` and read its `href` attribute via the new `BasePage.getHref(link)` helper — do NOT click this link at any point in this test.
    - expect: The link's `href` attribute value is exactly `https://www.youtube.com/c/AutomationExercise` (confirmed live), and the current page URL is still the site root ('/') at the end of the test — i.e. no navigation to youtube.com occurred, and the assertion is made purely from the DOM attribute.

### 2. Cross-Page Nav Presence

**Seed:** `tests/seed.spec.ts`

#### 2.1. [P1] Header nav bar is present, complete, and identical across shallow (non-gated) pages

**File:** `tests/ui/navigation/nav-cross-page-presence.spec.ts`

**Steps:**
  1. Assume a fresh, unauthenticated context. Navigate in turn to 3 representative shallow (non-authenticated, non-checkout) pages via their own Page Object's goto method: `ProductsPage` at `/products`, `CartPage` at `/view_cart` (via `gotoCart()`), and `LoginPage` at `/login` (via `gotoLogin()`). On each of the 3 pages, read the accessible name and `href` of all 8 static nav locators inherited from `BasePage` (`homeNavLink` through `contactUsNavLink`).
    - expect: On EACH of the 3 pages independently: all 8 nav locators are visible, and each one's `href` attribute exactly matches the same 8 values confirmed on Home in Scenario 1 (`/`, `/products`, `/view_cart`, `/login`, `/test_cases`, `/api_list`, the YouTube URL, `/contact_us`) — i.e. the nav bar's link set and destinations are identical regardless of which of these 3 pages it's viewed from. Any page where a nav item is missing, hidden, or points at a different href than Home's fails this scenario.

#### 2.2. [P0] Header nav bar remains present and correct through the deepest gated flow (Checkout, Payment)

**File:** `tests/ui/navigation/nav-gated-flow-presence.spec.ts`

**Steps:**
  1. Generate a unique synthetic test user (name/email/password) matching `SignupPage.generateTestUser()`'s pattern. Add one product to the cart from a `ProductDetailsPage` (e.g. product id 1), then view the cart via `CartPage.gotoCart()`.
    - expect: The cart shows exactly 1 line item for the added product before proceeding (a plain setup precondition, not itself a nav assertion).
  2. Click Proceed to Checkout while NOT logged in (`CartPage.clickProceedToCheckout()`), follow the login-gate modal's 'Register / Login' link, complete the New User Signup mini-form and the full Account Information form via `SignupPage`, landing logged-in on Home. Read all 8-or-11 header nav locators here (the 6 unaffected static items plus the logged-in-state items: `logoutNavLink`, `deleteAccountNavLink`, `loggedInAsText`).
    - expect: Confirmed logged in: `signupLoginNavLink` is gone, replaced by `logoutNavLink` ('Logout'), `deleteAccountNavLink` ('Delete Account'), and `loggedInAsText` containing the registered account's name — this is the baseline logged-in nav state used for comparison in the next step.
  3. Navigate back to `/view_cart` (`CartPage.gotoCart()`), click Proceed to Checkout again (now logged in, `CartPage.clickProceedToCheckout()` or `CheckoutPage.proceedToCheckoutFromCart()`), landing on `/checkout`. Read the same 6 static nav items (`homeNavLink`, `productsNavLink`, `cartNavLink`, `testCasesNavLink`, `apiTestingNavLink`, `videoTutorialsNavLink`, `contactUsNavLink`) plus the 3 logged-in-state items again.
    - expect: Page URL is exactly `/checkout`, `CheckoutPage.addressDetailsHeading` ('Address Details') is visible, AND all 9 nav items (6 static + Logout + Delete Account + Logged-in-as) are visible with the same hrefs/text confirmed on Home in the previous step — the nav bar did not disappear, shrink, or change on this deep page.
  4. From `/checkout`, click Place Order (`CheckoutPage.clickPlaceOrder()`) to land on `/payment`. Read the same 9 nav items once more.
    - expect: Page URL is exactly `/payment`, `CheckoutPage.paymentHeading` ('Payment') is visible, AND all 9 nav items are STILL visible with the same hrefs/text as on `/checkout` and Home — confirming the nav bar is uniform even on this deepest, most state-gated page in the entire site.
  5. Cleanup (required, do not skip): navigate to `/delete_account` (while still logged in from this same session) to delete the disposable test account created in step 1.
    - expect: `SignupPage.accountDeletedHeading` ('Account Deleted!') becomes visible, confirming the account was removed and no orphaned account is left behind. This is the test's final step regardless of whether earlier assertions passed or failed (cleanup must still run).

### 3. Back Navigation

**Seed:** `tests/seed.spec.ts`

#### 3.1. [P1] Browser back-navigation after following a nav link returns cleanly to the prior page

**File:** `tests/ui/navigation/nav-browser-back.spec.ts`

**Steps:**
  1. Assume a fresh, unauthenticated context. Instantiate `HomePage`, navigate to `/` via `gotoHome()`. Click `productsNavLink` to land on `/products`.
    - expect: Page URL is `/products` and `ProductsPage.allProductsHeading` is visible, confirming the forward hop landed correctly before testing back-navigation.
  2. Invoke the browser's native back navigation (`page.goBack()`). This is a single-hop boundary case (one back-step after one forward-step).
    - expect: Page URL returns to exactly '/' (the site root), `HomePage.featuresItemsHeading` ('Features Items') is visible again, no native dialog (e.g. a form-resubmission confirm) is presented (confirm this by asserting no unhandled `dialog` event fired during the back-navigation — the test should NOT need to register a dialog handler for this to succeed), and the page's content is fully re-rendered rather than a blank/stale view.
  3. Now test a multi-hop boundary case in the same test: from Home, click `productsNavLink` (-> `/products`), then click `cartNavLink` (-> `/view_cart`), building a 2-hop forward chain. Then call `page.goBack()` twice in succession.
    - expect: After the FIRST `goBack()`, the URL is exactly `/products` again (not '/' — confirming back-navigation steps through history one entry at a time rather than jumping to the very first page). After the SECOND `goBack()`, the URL is exactly '/' again. Both intermediate and final states render their respective page's already-established signal (`ProductsPage.allProductsHeading` after the first back, `HomePage.featuresItemsHeading` after the second), with no dialogs and no stale content at either step.

#### 3.2. [P1] Returning to a prior page via the nav bar itself (re-click) renders correctly

**File:** `tests/ui/navigation/nav-reclick.spec.ts`

**Steps:**
  1. Assume a fresh, unauthenticated context. Instantiate `HomePage`, navigate to `/` via `gotoHome()`. Click `productsNavLink` to land on `/products`, confirming `ProductsPage.allProductsHeading` is visible.
    - expect: Page URL is `/products` before proceeding to the re-click step — a plain setup precondition.
  2. From `/products`, click `homeNavLink` in the SAME header nav bar (not browser back) to return to Home.
    - expect: Page URL is exactly '/' again, and `HomePage.featuresItemsHeading` ('Features Items') is visible — confirming that returning to a prior page via the nav bar's own link (rather than the browser's back button) renders that page correctly and is not affected by any stale state left over from the intervening `/products` visit (e.g. the home page's carousel/product grid is present and not blank).

### 4. Authenticated Nav State

**Seed:** `tests/seed.spec.ts`

#### 4.1. [P2] Signup/Login nav item correctly transitions to Logout/Delete Account/Logged-in-as after auth, and reverts on Logout

**File:** `tests/ui/navigation/nav-auth-state.spec.ts`

**Steps:**
  1. Assume a fresh, unauthenticated context. Instantiate `HomePage`, navigate to `/`. Confirm the logged-out baseline nav state before registering anything.
    - expect: `signupLoginNavLink` ('Signup / Login', href '/login') is visible, AND `logoutNavLink`, `deleteAccountNavLink`, and `loggedInAsText` are all NOT present/visible — this is the confirmed default logged-out nav state.
  2. Generate a unique synthetic test user matching `SignupPage.generateTestUser()`'s pattern. Register it via `LoginPage.gotoLogin()` -> `startSignup()` -> `SignupPage.fillAccountInformation()` -> `submit()` -> `continueButton.click()`, landing logged-in on Home.
    - expect: `signupLoginNavLink` is now NOT present. In its place: `logoutNavLink` ('Logout') is visible with href '/logout', `deleteAccountNavLink` ('Delete Account') is visible with href '/delete_account', and `loggedInAsText` is visible and contains the exact registered name.
  3. Click `logoutNavLink`.
    - expect: Page URL is exactly '/login', `LoginPage.loginHeading` ('Login to your account') is visible, AND the nav bar has reverted: `signupLoginNavLink` is visible again while `logoutNavLink`, `deleteAccountNavLink`, and `loggedInAsText` are all no longer present — confirming Logout both ends the session and restores the original logged-out nav state, matching step 1's baseline exactly.
  4. Cleanup (required, do not skip): log back in with the same generated credentials via `LoginPage.loginWithCredentials(email, password)`, then navigate to `/delete_account` and delete the fixture account.
    - expect: Login succeeds (landing on '/' with the logged-in nav state visible again), then `SignupPage.accountDeletedHeading` ('Account Deleted!') becomes visible after the delete step, confirming no orphaned account is left behind. This is the test's final step regardless of whether earlier assertions passed or failed.
