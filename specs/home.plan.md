# Home Page Test Plan

## Application Overview

This plan covers the AutomationExercise home page (https://automationexercise.com/): initial page load and key section visibility, primary header navigation to other top-level pages, the footer newsletter subscription widget, and the scroll-to-top control. Login/registration/cart/checkout flows are explicitly out of scope and covered elsewhere.

Page Object status: `tests/pages/` is currently empty. This is the FIRST area through the pipeline, so:
- `tests/pages/BasePage.ts` (NEW) must be created as the shared base class other page objects will extend. It should hold common helpers such as `goto(path)`, a generic `waitForLoad()`, and shared locators/methods that are reused across pages (e.g. header nav locators, footer/subscription locators, scroll-to-top button) so later page objects (Products, Cart, Login, etc.) can extend it instead of duplicating header/footer logic.
- `tests/pages/HomePage.ts` (NEW) extends `BasePage`. Required locators/methods:
  - `gotoHome()` — navigates to `/` and waits for the "Features Items" heading to be visible (confirms full load).
  - Header/nav locators: `homeNavLink`, `productsNavLink`, `cartNavLink`, `signupLoginNavLink`, `testCasesNavLink`, `apiTestingNavLink`, `videoTutorialsNavLink`, `contactUsNavLink` (all `getByRole('link', { name: ... })` scoped to the header, matched by their visible text since no `data-qa` attributes exist on the home page nav).
  - Section locators used only for visibility assertions: `logo` (header `img[alt="Website for automation practice"]`), `carousel` (`#slider-carousel` region), `categorySidebarHeading` (`heading "Category"`), `featuresItemsHeading` (`heading "Features Items"`), `recommendedItemsHeading` (`heading "recommended items"`), `footer` (`contentinfo`/`#footer`).
  - Subscription locators/methods: `subscribeEmailInput` (`#susbscribe_email`), `subscribeButton` (`#subscribe`), `subscribeSuccessAlert` (`.alert-success`), and a `subscribe(email)` helper that fills the input and clicks the button.
  - Scroll-to-top locators/methods: `scrollToTopButton` (`#scrollUp`), and a `scrollToBottom()` helper (`window.scrollTo` or `mouse.wheel`) used to make the button appear before testing it.

Confirmed technical facts from exploration (to prevent the generator from guessing):
- All primary header nav items are plain `<a href="...">` links producing full page navigations, not SPA/JS routes: Home -> `/`, Products -> `/products` (confirmed by direct navigation, title changes to "Automation Exercise - All Products"), Cart -> `/view_cart`, Signup/Login -> `/login`, Test Cases -> `/test_cases`, API Testing -> `/api_list`, Video Tutorials -> external `https://www.youtube.com/c/AutomationExercise` (opens same tab per href, no `target=_blank` attribute observed), Contact us -> `/contact_us`.
- The newsletter subscription input (`#susbscribe_email`) is `type="email"` and has the `required` HTML attribute — there is no dedicated backend endpoint for it. Confirmed via `browser_network_requests`: clicking Subscribe with a valid email produced zero requests to any `automationexercise.com` endpoint beyond the already-loaded static assets (no XHR/fetch to a `/subscribe`-style route); the "You have been successfully subscribed!" message (`div.alert-success`) is inserted purely client-side by `static/js/subscription.js`, and the email input is cleared afterward. Therefore subscription is a client-side-only feature — no API-level test coverage applies here, and success/failure must be asserted via DOM state, not network calls.
- Empty or invalid-format email is blocked by native HTML5 constraint validation (input is `type="email"` + `required`): the browser shows its built-in validation bubble and the form does not submit (`.alert-success` never appears). This should be asserted via the element's `validationMessage`/`checkValidity()` (accessible through `browser_evaluate` in the generated test) rather than trying to read the (non-existent, browser-native) popup as DOM text.
- The scroll-to-top button (`#scrollUp`) is present in the DOM at all times but has `display: none` until the user scrolls down; confirmed it becomes `display: block` after scrolling to `window.scrollY = 2000`, and clicking it animates the page back to `window.scrollY = 0`.
- No `data-qa`/`data-testid` attributes exist anywhere on the home page (unlike some other AutomationExercise pages) — locators must rely on role/text/id selectors as listed above.

Priority legend used in each test name below: [P0]=Critical, [P1]=High, [P2]=Medium, [P3]=Low. Priority reflects risk-based impact: full page-load/render failures and broken primary navigation are Critical/High (they block every other user journey on the site), the subscription widget is Medium (self-contained, non-transactional feature), and the scroll-to-top convenience control is Low (cosmetic, no functional impact if broken).

## Test Scenarios

### 1. Home Page

**Seed:** `tests/seed.spec.ts`

#### 1.1. [P0-Critical] Home page loads with all key sections visible

**File:** `tests/ui/home/home.spec.ts`

**Steps:**
  1. Navigate to https://automationexercise.com/ (fresh/blank browser state, no prior login or cart items).
    - expect: Page title equals 'Automation Exercise'.
    - expect: Header logo image (alt text 'Website for automation practice') is visible.
    - expect: Header nav list contains all 7 expected links with exact visible text: 'Home', 'Products', 'Cart', 'Signup / Login', 'Test Cases', 'API Testing', 'Video Tutorials', 'Contact us'.
  2. Scroll through the page from top to bottom without clicking anything.
    - expect: The hero/carousel region (#slider-carousel) is visible near the top.
    - expect: A 'Category' heading is visible in the left sidebar with 'Women', 'Men', and 'Kids' sub-links.
    - expect: A 'Brands' heading is visible in the left sidebar with at least one brand link (e.g. 'Polo').
    - expect: A 'Features Items' heading is visible with at least one product card showing a price in the format 'Rs. <number>', a product name, and both 'Add to cart' and 'View Product' controls.
    - expect: A 'recommended items' heading is visible further down the page.
    - expect: A 'Subscription' heading is visible in the footer, containing an email textbox with placeholder 'Your email address' and a submit button.
    - expect: Footer contains the copyright text containing 'All rights reserved'.

#### 1.2. [P1-High] Header navigation lands on the correct destination page for each top-level link

**File:** `tests/ui/home/home-navigation.spec.ts`

**Steps:**
  1. From the home page, click the 'Products' nav link.
    - expect: Resulting URL path is exactly '/products'.
    - expect: Page title equals 'Automation Exercise - All Products'.
  2. Navigate back to the home page, then click the 'Cart' nav link.
    - expect: Resulting URL path is exactly '/view_cart'.
  3. Navigate back to the home page, then click the 'Signup / Login' nav link.
    - expect: Resulting URL path is exactly '/login'.
  4. Navigate back to the home page, then click the 'Test Cases' nav link.
    - expect: Resulting URL path is exactly '/test_cases'.
  5. Navigate back to the home page, then click the 'API Testing' nav link.
    - expect: Resulting URL path is exactly '/api_list'.
  6. Navigate back to the home page, then click the 'Contact us' nav link.
    - expect: Resulting URL path is exactly '/contact_us'.

#### 1.3. [P2-Medium] Newsletter subscription accepts a valid email and shows the success confirmation

**File:** `tests/ui/home/home-subscription.spec.ts`

**Steps:**
  1. On the home page, scroll to the footer Subscription box. Confirm the email input is empty (fresh state, no pre-filled value). Fill it with a syntactically valid, unique email address (e.g. using a timestamp/random suffix to avoid collisions) and click the subscribe (arrow) button.
    - expect: A green success element with class 'alert-success' becomes visible in the DOM containing the exact text 'You have been successfully subscribed!'.
    - expect: The email input's value is reset to an empty string after submission (this is the observed post-submit behavior — the input value equals '').

#### 1.4. [P2-Medium] Newsletter subscription rejects empty email via native HTML5 validation

**File:** `tests/ui/home/home-subscription.spec.ts`

**Steps:**
  1. On the home page, scroll to the footer Subscription box. Leave the email input empty and click the subscribe button.
    - expect: No 'alert-success' element is added to the DOM (subscription is not accepted).
    - expect: The email input element's `validity.valid` is `false` and `validity.valueMissing` is `true` (native required-field validation fires because the input has the HTML5 `required` attribute), confirmed by evaluating the input's ValidityState in-page.

#### 1.5. [P2-Medium] Newsletter subscription rejects malformed email via native HTML5 validation

**File:** `tests/ui/home/home-subscription.spec.ts`

**Steps:**
  1. On the home page, scroll to the footer Subscription box. Type a string with no '@' symbol (e.g. 'notanemail') into the email input and click the subscribe button.
    - expect: No 'alert-success' element is added to the DOM.
    - expect: The email input element's `validity.valid` is `false` and `validity.typeMismatch` is `true` (native type=email validation fires), confirmed by evaluating the input's ValidityState in-page.

#### 1.6. [P3-Low] Scroll-to-top button appears on scroll and returns the page to the top

**File:** `tests/ui/home/home-scroll.spec.ts`

**Steps:**
  1. On a freshly loaded home page, confirm the scroll-to-top button (#scrollUp) is present in the DOM but not visible (CSS display equals 'none') before any scrolling occurs.
    - expect: #scrollUp element's computed display style equals 'none' at page load, i.e. the control is not visible to the user initially.
  2. Scroll the page down by at least 2000px (e.g. via mouse wheel or window.scrollTo).
    - expect: #scrollUp element's computed display style equals 'block' (control becomes visible) once window.scrollY exceeds the reveal threshold.
  3. Click the now-visible scroll-to-top button and wait for the scroll animation to complete.
    - expect: window.scrollY equals 0 after the animation finishes, i.e. the page has returned exactly to the top.
