# Informational Pages Test Plan

## Application Overview

This plan covers the AutomationExercise "Informational Pages" chunk: the two static documentation pages `/test_cases` and `/api_list`. Per the committed strategy (`specs/test-plan.md` §2/§3), this is the last remaining chunk and is explicitly capped at P3 (lowest priority) — both pages are read-only, client-side Bootstrap accordions with no user transactions and no backend calls of their own. Coverage here is DELIBERATELY LIGHT per that strategy: page-load/content-presence smoke checks plus a couple of representative "expand an item, confirm its content becomes visible" checks — NOT exhaustive per-item interaction or content-diffing of all 26 test cases / 14 API entries.

Existing coverage check: no `specs/*.plan.md` or `tests/**` currently plans/tests the CONTENT of these two pages. `tests/ui/navigation/nav-internal-links.spec.ts` and two sibling nav spec files (part of the already-implemented Cross-Page Navigation chunk, `specs/navigation.plan.md`) already confirm that clicking the header's "Test Cases" and "API Testing" nav links lands on `/test_cases` and `/api_list` respectively — this plan's own "reach the page via nav link" steps necessarily re-exercise that same click as a setup step (unavoidable, mirrors how every other chunk's plan begins from a nav click), but do not duplicate the Cross-Page Navigation chunk's actual assertions (link destination across every page) — this plan's assertions are entirely about the two pages' own content and accordion behavior, which is new coverage.

Page Object plan: a single NEW `tests/pages/InformationalPage.ts`, extending `BasePage` (reuses its `testCasesNavLink`/`apiTestingNavLink` header locators rather than redeclaring them — clicking those two existing nav links is how both pages are reached in every scenario below). One shared class (not two separate page objects) is the right call here: live exploration confirmed `/test_cases` and `/api_list` are rendered from the literal same Bootstrap-accordion template — identical header/footer, identical `.panel-heading > a[data-toggle="collapse"][href="#collapseN"]` / `#collapseN` panel structure, identical "Feedback for Us" section — differing only in heading text, intro sentence, and the number of numbered items (26 vs 14). A single parameterized class avoids duplicating that shared template logic, consistent with the project's existing precedent of `ProductsPage.ts` covering both `/products` and `/brand_products/{Brand}` from one class.

`InformationalPage.ts` locators/methods needed:
- `pageHeading` — `getByRole('heading', { level: 2 })` scoped to the main content area (exact text is 'Test Cases' or 'APIs List for practice' depending on which page; scenarios assert the exact expected string per page rather than the locator baking in one value).
- `introText` — `getByRole('heading', { level: 5 })`, the descriptive sentence directly under the main heading.
- `accordionLinks` — `page.locator('a[data-toggle="collapse"]')`, ALL collapsible header links on the page (confirmed live: this includes every numbered item PLUS exactly one trailing "Feedback for Us" link — 27 total on `/test_cases`, 15 total on `/api_list`).
- `feedbackHeadingLink` — `getByRole('link', { name: 'Feedback for Us' })`.
- `feedbackEmailLink` — `getByRole('link', { name: 'feedback@automationexercise.com' })` (a `mailto:` link).
- `gotoTestCases()` — clicks `this.testCasesNavLink` (inherited from `BasePage`) and waits for `pageHeading` (text 'Test Cases') to be visible.
- `gotoApiList()` — clicks `this.apiTestingNavLink` (inherited from `BasePage`) and waits for `pageHeading` (text 'APIs List for practice') to be visible.
- `expandAccordionItem(linkName: string | RegExp)` — locates the link via `getByRole('link', { name: linkName })`, reads its own `href` attribute (e.g. `#collapse7`) to derive the corresponding panel locator (`page.locator(href)`), clicks the link, waits for that panel to become visible, and returns the panel `Locator` so the calling test can assert on its text content. Calling this again on the SAME link toggles it back closed (confirmed live: this is a plain per-item Bootstrap `collapse` toggle, not a one-shot reveal).
- `isAccordionItemCollapsed(linkName: string | RegExp)` — returns whether the link's `class` attribute contains `'collapsed'` (the confirmed default/closed-state marker) as a boolean, used for the default-collapsed-state assertions without needing to also re-derive and check the panel's computed `display` separately in every scenario.

Confirmed technical facts from live exploration (to prevent the generator from guessing):
- NO `data-qa`/`data-testid` attributes exist anywhere on either page (confirmed via `document.querySelectorAll('[data-qa]').length === 0` / same for `data-testid` on both `/test_cases` and `/api_list`) — this is consistent with Home/Products/Cart's already-documented zero-`data-qa` pattern in `specs/test-plan.md` §4, NOT with Login/Signup/Contact's pattern. All locators above use role/id/attribute-selector fallbacks accordingly, per that convention.
- Both pages are entirely client-side: confirmed via `browser_network_requests` that expanding/collapsing accordion items produces ZERO requests to any `automationexercise.com` endpoint (only third-party ad/analytics noise — Google ad-tech pings — which is unrelated background traffic, not a call this feature makes). No API-level test coverage applies to the accordion interaction itself; the REST endpoints DOCUMENTED on `/api_list` are exercised elsewhere by the already-implemented API Test Track (`specs/api.plan.md`, `tests/api/**`), not by this UI chunk.
- `/test_cases` contains exactly 27 elements matching `a[data-toggle="collapse"]`: 26 numbered "Test Case N: <description>" headings (N = 1..26, confirmed first is "Test Case 1: Register User" and last is "Test Case 26: Verify Scroll Up without 'Arrow' button and Scroll Down functionality") plus exactly one "Feedback for Us" link. `/api_list` contains exactly 15: 14 numbered "API N: <description>" headings (first "API 1: Get All Products List", last "API 14: GET user account detail by email") plus one "Feedback for Us" link.
- Default (freshly-loaded) state is confirmed COLLAPSED for every item on both pages: each header link's `class` attribute equals `"collapsed"` and its corresponding panel (`#collapseN`) has `class="panel-collapse collapse"` with computed CSS `display: none`. This was directly confirmed via DOM read on first load, not assumed.
- Clicking a header link toggles its OWN panel independently — confirmed live these are NOT a single-open ("only one panel expands, others auto-close") accordion group: no `data-parent` attribute exists on any link and each panel's `.panel-group` ancestor has no shared `id`, meaning two (or more) items can be expanded simultaneously with no interference. Clicking an already-open item's header a second time collapses it again (plain toggle), confirmed live. This was confirmed by expanding "Test Case 1" and "Test Case 2" simultaneously and observing both panels' computed `display` read `block` at the same time.
- Expanded-panel content was confirmed to contain real, item-specific text, not placeholder/empty content: `#collapse1` on `/test_cases` reveals an ordered step list beginning "1. Launch browser", "2. Navigate to url 'http://automationexercise.com'"; `#collapse1` on `/api_list` reveals the exact lines "API URL: https://automationexercise.com/api/productsList", "Request Method: GET", "Response Code: 200"; `#collapse2` on `/api_list` (a distinct entry for the same underlying endpoint) reveals "Request Method: POST", confirming distinct entries render genuinely distinct content rather than a duplicated template.
- The "Feedback for Us" section (present identically at the bottom of both pages, below the last numbered item) contains a real `mailto:feedback@automationexercise.com` link with that exact visible text — confirmed via `href` attribute read, not clicked (per this project's scope discipline, `mailto:` links are never actually followed/dispatched in a test).
- Page titles are confirmed exact: `/test_cases` → "Automation Practice Website for UI Testing - Test Cases"; `/api_list` → "Automation Practice for API Testing".
- The footer newsletter subscription widget is present identically on both pages (inherited `BasePage` locators) — it is NOT re-tested here since it is already fully covered by `specs/home.plan.md` (client-side-only feature, no dedicated backend endpoint) and re-testing it per-page would be pure duplication with no new risk surfaced.

Priority legend: [P0]=Critical, [P1]=High, [P2]=Medium, [P3]=Low. Per `specs/test-plan.md` §3 this entire chunk is capped at P3 (static documentation content, smoke-level checks only, zero transactional risk) — there is no higher tier available under that cap, so every scenario below is tagged P3. Within that flat tier, the two page-load/content-presence scenarios (1, 3) are the chunk's relatively higher-value checks (they'd catch a page failing to render at all), while the two accordion-interaction scenarios (2, 4) are lower-value convenience/regression checks on a purely cosmetic interaction — this relative ordering is noted in prose since the priority tag scale itself bottoms out at P3.

## Test Scenarios

### 1. Informational Pages

**Seed:** `tests/seed.spec.ts`

#### 1.1. 1.1. Test Cases page loads with the full list of 26 entries, all collapsed by default

**File:** `tests/ui/informational/test-cases.spec.ts`

**Steps:**
  1. [P3] Assumptions: fresh, unauthenticated browser context, no prior navigation. Starting from the home page (https://automationexercise.com/), using InformationalPage.gotoTestCases() (which clicks BasePage.testCasesNavLink), navigate to /test_cases.
    - expect: Resulting URL path is exactly '/test_cases'.
    - expect: Page title equals exactly 'Automation Practice Website for UI Testing - Test Cases'.
    - expect: The pageHeading (level-2 heading) is visible with the exact text 'Test Cases'.
    - expect: The introText (level-5 heading) is visible and its text contains 'Click on the scenario for detailed Test Steps'.
  2. Query all accordionLinks (a[data-toggle="collapse"]) on the page.
    - expect: Exactly 27 such links exist in total.
    - expect: 26 of them have visible text starting with 'Test Case N:' where N runs 1 through 26 in document order (confirmed: the first link's text starts with 'Test Case 1:' and the last numbered link's text starts with 'Test Case 26:'), plus exactly 1 additional link with the exact text 'Feedback for Us'.
    - expect: For a spot-checked sample of 3 items (first 'Test Case 1', a middle 'Test Case 13', and the last 'Test Case 26'), isAccordionItemCollapsed() returns true (class attribute contains 'collapsed') AND the corresponding #collapseN panel's computed CSS display equals 'none' — confirming the default freshly-loaded state is fully collapsed, not just for the first item.
  3. Scroll to the bottom of the accordion list, below item 26, to the Feedback for Us section.
    - expect: feedbackHeadingLink ('Feedback for Us') is visible.
    - expect: feedbackEmailLink is visible with the exact visible text 'feedback@automationexercise.com' and an href attribute equal to exactly 'mailto:feedback@automationexercise.com' (read via getAttribute, not clicked).

#### 1.2. 1.2. Expanding Test Cases accordion items reveals step content, supports independent multi-open state, and re-collapses on a second click

**File:** `tests/ui/informational/test-cases.spec.ts`

**Steps:**
  1. [P3] Assumptions: fresh visit to /test_cases via InformationalPage.gotoTestCases() (same as scenario 1.1, independent test run). Call expandAccordionItem('Test Case 1: Register User').
    - expect: The returned #collapse1 panel is visible (computed CSS display equals 'block').
    - expect: The panel's visible text begins with an ordered list whose first two entries read exactly '1. Launch browser' and a second line containing 'Navigate to url' and 'automationexercise.com' — confirming real, non-empty step content renders.
    - expect: isAccordionItemCollapsed('Test Case 1: Register User') now returns false (its link's class attribute no longer contains 'collapsed').
  2. Without collapsing item 1, call expandAccordionItem('Test Case 7: Verify Test Cases Page').
    - expect: The returned #collapse7 panel is visible (display 'block').
    - expect: The #collapse1 panel from the previous step REMAINS visible at the same time (display still 'block') — confirming these accordion items expand independently, i.e. this is NOT a single-open accordion group where opening one auto-closes others.
    - expect: The #collapse7 panel's visible text content is different from the #collapse1 panel's visible text content (they are not rendering duplicate/identical content).
  3. Call expandAccordionItem('Test Case 1: Register User') a second time (re-clicking the same, already-open header link).
    - expect: The #collapse1 panel returns to NOT visible (computed CSS display equals 'none' again), confirming the header link toggles its own panel open and closed on repeated clicks rather than only ever opening it.
    - expect: The #collapse7 panel (not re-clicked in this step) remains visible and unaffected by item 1 being re-collapsed.

#### 1.3. 1.3. API List page loads with the full list of 14 documented endpoints, all collapsed by default

**File:** `tests/ui/informational/api-list.spec.ts`

**Steps:**
  1. [P3] Assumptions: fresh, unauthenticated browser context, no prior navigation. Starting from the home page, using InformationalPage.gotoApiList() (which clicks BasePage.apiTestingNavLink), navigate to /api_list.
    - expect: Resulting URL path is exactly '/api_list'.
    - expect: Page title equals exactly 'Automation Practice for API Testing'.
    - expect: The pageHeading (level-2 heading) is visible with the exact text 'APIs List for practice'.
    - expect: The introText (level-5 heading) is visible and its text contains 'Click on the scenario for detailed API'.
  2. Query all accordionLinks (a[data-toggle="collapse"]) on the page.
    - expect: Exactly 15 such links exist in total.
    - expect: 14 of them have visible text starting with 'API N:' where N runs 1 through 14 in document order (confirmed: the first link's text starts with 'API 1: Get All Products List' and the last numbered link's text starts with 'API 14: GET user account detail by email'), plus exactly 1 additional link with the exact text 'Feedback for Us'.
    - expect: For a spot-checked sample of 3 items (first 'API 1', a middle 'API 7', and the last 'API 14'), isAccordionItemCollapsed() returns true AND the corresponding #collapseN panel's computed CSS display equals 'none' — confirming the default freshly-loaded state is fully collapsed.
  3. Scroll to the bottom of the accordion list, below item 14, to the Feedback for Us section.
    - expect: feedbackHeadingLink ('Feedback for Us') is visible.
    - expect: feedbackEmailLink is visible with the exact visible text 'feedback@automationexercise.com' and href attribute equal to exactly 'mailto:feedback@automationexercise.com'.

#### 1.4. 1.4. Expanding representative API accordion items reveals distinct endpoint/method/response details per entry

**File:** `tests/ui/informational/api-list.spec.ts`

**Steps:**
  1. [P3] Assumptions: fresh visit to /api_list via InformationalPage.gotoApiList() (same as scenario 1.3, independent test run). Call expandAccordionItem('API 1: Get All Products List').
    - expect: The returned #collapse1 panel is visible (display 'block').
    - expect: The panel's visible text contains exactly the lines 'API URL: https://automationexercise.com/api/productsList', 'Request Method: GET', and 'Response Code: 200' — confirming the documented endpoint/method/response details render correctly, not an empty or placeholder panel.
  2. Without collapsing item 1, call expandAccordionItem('API 2: POST To All Products List') (a distinct entry documenting a different HTTP method against the same underlying endpoint).
    - expect: The returned #collapse2 panel is visible (display 'block') and its visible text contains 'Request Method: POST' — distinct from API 1's 'Request Method: GET' — confirming each accordion entry renders its own specific content rather than a duplicated shared template.
    - expect: The #collapse1 panel from the previous step REMAINS visible at the same time, consistent with the same independent multi-open accordion behavior already confirmed on the Test Cases page (scenario 1.2).
