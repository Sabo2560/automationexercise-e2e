# API Test Track Plan

## Application Overview

This plan covers the AutomationExercise "API Test Track" — a pure REST API test suite under `tests/api/**` that exercises the endpoints documented at `https://automationexercise.com/api_list`, using Playwright's `request` fixture directly against the live REST API. No browser page interaction, UI assertions, or Page Objects are involved in the tests themselves — every scenario is a direct HTTP call with a JSON-body assertion.

**Page Object status:** NONE required for this track. Unlike the UI chunks (`LoginPage.ts`, `SignupPage.ts`, etc. under `tests/pages/`), API tests interact with the site through Playwright's built-in `request` fixture (`request.get(...)`, `request.post(...)`, `request.put(...)`, `request.delete(...)`) and assert directly on `response.status()` / `response.json()`. No new page object is needed or appropriate.

**Already covered (do not replan, referenced here for context only):**
- `tests/api/products.spec.ts` — GET/POST `/api/productsList`
- `tests/api/brands.spec.ts` — GET/PUT `/api/brandsList`

**Critical confirmed platform-wide fact (from live exploration, applies to every scenario in this plan):** every single endpoint on this site returns raw HTTP status 200 at the transport level, REGARDLESS of the semantic outcome. The real "status code" the API contract cares about is the `responseCode` field inside the JSON body (200 = success, 201 = created, 400 = bad request, 404 = not found, 405 = method not supported). This was independently reconfirmed live for every negative case explored below (missing params, GET on verifyLogin, invalid credentials, not-found lookups) — none of them produced a non-200 HTTP transport status; `response.ok()` is true in every case, and only `body.responseCode`/`body.message` distinguish success from failure. This matches the pattern already established in `products.spec.ts`/`brands.spec.ts` (POST `/api/productsList` returns HTTP 200 with body `responseCode: 405`). Every scenario below asserts on `response.status()` (always 200) plus `body.responseCode` and `body.message`/data shape — never on `response.ok()` alone, since that would pass even for documented-as-error cases.

**Endpoints in scope for this plan** (all confirmed live via `browser_evaluate`-driven `fetch` calls against the real API on 2026-08-27, cross-checked against the documented request method/params/response on `/api_list`):
1. POST `/api/searchProduct` — valid `search_product` param
2. POST `/api/searchProduct` — missing `search_product` param
3. POST `/api/verifyLogin` — valid credentials (against a disposable fixture account)
4. POST `/api/verifyLogin` — missing email param, missing password param
5. GET `/api/verifyLogin` — method not supported
6. POST `/api/verifyLogin` — invalid/wrong credentials
7. POST `/api/createAccount` — full valid registration; also a missing-required-field negative case
8. DELETE `/api/deleteAccount` — valid cleanup of a fixture account
9. PUT `/api/updateAccount` — updates an existing account's fields
10. GET `/api/getUserDetailByEmail` — valid email lookup and not-found lookup (bonus: documented as API 14 on `/api_list`, not yet covered by any existing spec, included here for completeness since this plan covers "remaining documented endpoints")

**Note on the task's suggested "updateProduct" method-check line item:** the `/api_list` page does NOT document any `updateProduct`/product-mutation endpoint beyond the already-covered POST-not-supported case on `/api/productsList` and PUT-not-supported case on `/api/brandsList`. The only "update" endpoint documented anywhere on the page is API 13, `PUT /api/updateAccount` (account fields, not products), which is already covered as its own scenario below. This line item is therefore dropped as inapplicable rather than invented.

**Confirmed exact request/response contracts (from the live `/api_list` docs page, all independently reconfirmed via live fetch calls in this exploration):**
- `POST /api/searchProduct` with `search_product=Top` → HTTP 200, body `{ responseCode: 200, products: [...] }` (14 matching products observed, each with `id`/`name`/`price`/`brand`/`category.category`/`category.usertype.usertype`).
- `POST /api/searchProduct` with no `search_product` param → HTTP 200, body `{ responseCode: 400, message: "Bad request, search_product parameter is missing in POST request." }`.
- `POST /api/verifyLogin` with valid email+password of a real account → HTTP 200, body `{ responseCode: 200, message: "User exists!" }`.
- `POST /api/verifyLogin` missing `email` (only password sent) → HTTP 200, body `{ responseCode: 400, message: "Bad request, email or password parameter is missing in POST request." }`. Missing `password` (only email sent) produces the identical `responseCode`/`message` (confirmed both variants live; the API does not distinguish which of the two params was omitted).
- `GET /api/verifyLogin` → HTTP 200, body `{ responseCode: 405, message: "This request method is not supported." }`.
- `POST /api/verifyLogin` with a real email but wrong password → HTTP 200, body `{ responseCode: 404, message: "User not found!" }` — confirmed distinct from the missing-param case (400) and the GET case (405).
- `POST /api/createAccount` with all documented fields (`name, email, password, title, birth_date, birth_month, birth_year, firstname, lastname, company, address1, address2, country, zipcode, state, city, mobile_number`) → HTTP 200, body `{ responseCode: 201, message: "User created!" }`. Omitting a required field (e.g. `email`) → HTTP 200, body `{ responseCode: 400, message: "Bad request, email parameter is missing in POST request." }` (message names the specific missing field).
- `DELETE /api/deleteAccount` with `email`+`password` of an existing account → HTTP 200, body `{ responseCode: 200, message: "Account deleted!" }`. Confirmed the account is truly gone afterward: a subsequent `verifyLogin` for the same credentials returns `responseCode: 404`/`"User not found!"`.
- `PUT /api/updateAccount` with the same field set as `createAccount` (existing account's email + new values for the rest) → HTTP 200, body `{ responseCode: 200, message: "User updated!" }`. Confirmed the update actually persists: a follow-up `GET /api/getUserDetailByEmail` for that email reflects every changed field (name, title, dob, first/last name, company, address1/2, country, state, city — all changed values observed in the response, not just the unchanged email/zipcode... note zipcode was also changed and confirmed reflected).
- `GET /api/getUserDetailByEmail?email=...` for an existing account → HTTP 200, body `{ responseCode: 200, user: {...} }` with fields `id, name, email, title, birth_day, birth_month, birth_year, first_name, last_name, company, address1, address2, country, state, city, zipcode` (note: field names here differ slightly from the create/update request param names, e.g. `birth_day` not `birth_date`, `first_name`/`last_name` not `firstname`/`lastname`). For a non-existent email → HTTP 200, body `{ responseCode: 404, message: "Account not found with this email, try another email!" }`.

**Test data / cleanup discipline:** every scenario that calls `createAccount` must generate a unique email per run (same convention as `tests/pages/SignupPage.ts`'s `generateTestUser()` — timestamp + random suffix, no real personal data) and MUST call `deleteAccount` for that same account by the end of the test (in a `finally`/cleanup step) so no fixture account is ever left orphaned on the shared public site, mirroring the discipline already established in `specs/account.plan.md`. This was verified achievable live during this exploration: a fixture account was created, exercised through verifyLogin (valid/invalid/missing-param variants), getUserDetailByEmail, and updateAccount, then fully deleted, with the post-delete verifyLogin call confirming HTTP 200 `responseCode: 404` — no trace of the account remained.

**File organization** (mirrors the existing one-file-per-endpoint-group convention of `products.spec.ts`/`brands.spec.ts`): `tests/api/search.spec.ts` (search endpoints), `tests/api/login.spec.ts` (verifyLogin endpoints), `tests/api/account.spec.ts` (createAccount/updateAccount/deleteAccount/getUserDetailByEmail — grouped together since most scenarios need a fixture account shared across create -> update -> lookup -> delete).

Priority legend: [P0]=Critical, [P1]=High, [P2]=Medium, [P3]=Low. Rationale: `verifyLogin` (valid case) and `createAccount`/`deleteAccount` are P0 — they are the API-level equivalent of the site's core auth contract, and `deleteAccount` in particular is P0 because every other account-creating scenario in this entire plan (and the broader suite's cleanup discipline) depends on it working correctly to avoid orphaning fixture data on the live site. `searchProduct` (valid) and `verifyLogin` invalid/missing-param/method-not-supported variants are P1 — important contract coverage but not gating other tests. `updateAccount` and `getUserDetailByEmail` are P2 since they are supplementary account-management operations not on the critical registration/login/cleanup path. The `createAccount` missing-field negative case is P2 boundary coverage.

## Test Scenarios

### 1. Search Product API

**Seed:** `tests/seed.spec.ts`

#### 1.1. POST /api/searchProduct with a valid search_product param returns matching products

**File:** `tests/api/search.spec.ts`

**Steps:**
  1. Send `request.post('/api/searchProduct', { form: { search_product: 'Top' } })` (a keyword confirmed live to return real matches, not chosen arbitrarily).
    - expect: `response.status()` equals 200 (raw HTTP transport status, per the platform-wide confirmed fact that this API never returns a non-200 HTTP status).
    - expect: The parsed JSON body's `responseCode` field equals 200.
    - expect: `body.products` is an array with `length > 0`.
    - expect: Every element of `body.products` has the properties `id`, `name`, `price`, `brand`, and `category` (an object containing a nested `category` string and `usertype.usertype` string) — assert this on at least the first element and confirm the array length matches `products.filter(p => p.name.toLowerCase().includes('top')).length === products.length` is NOT required (the API does substring/category matching, not strict name-only filtering) — instead assert only that every returned product's `name` OR `category.category` reasonably relates to the search term is NOT reliable either; the concrete, verifiable assertion is: the array is non-empty and every product object has all five required properties with correct types (`id`: number, `name`: string, `price`: string starting with 'Rs.', `brand`: string, `category.category`: string).

#### 1.2. POST /api/searchProduct without the search_product param returns a 400 responseCode with the documented bad-request message

**File:** `tests/api/search.spec.ts`

**Steps:**
  1. Send `request.post('/api/searchProduct')` with no body/form data at all.
    - expect: `response.status()` equals 200 (transport status, per the platform-wide confirmed fact — do NOT assert `response.ok()` as the sole success signal).
    - expect: The parsed JSON body's `responseCode` field equals exactly 400 (a number, not the string '400').
    - expect: `body.message` equals exactly the string 'Bad request, search_product parameter is missing in POST request.'

### 2. Verify Login API

**Seed:** `tests/seed.spec.ts`

#### 2.1. POST /api/verifyLogin with valid credentials of a real (fixture) account returns User exists

**File:** `tests/api/login.spec.ts`

**Steps:**
  1. Setup: generate a unique test user (timestamp/random-suffixed email, matching `tests/pages/SignupPage.ts`'s `generateTestUser()` convention) and register it via `request.post('/api/createAccount', { form: {...all required fields...} })`. Confirm the account was created before proceeding.
    - expect: The createAccount response body's `responseCode` equals 201 and `message` equals 'User created!', confirming the fixture account now exists before the login check depends on it.
  2. Send `request.post('/api/verifyLogin', { form: { email: <fixture email>, password: <fixture password> } })`.
    - expect: `response.status()` equals 200.
    - expect: The parsed JSON body's `responseCode` field equals exactly 200.
    - expect: `body.message` equals exactly the string 'User exists!'
  3. Cleanup (always runs, e.g. in a `test.step`/`finally` or `afterEach`): send `request.delete('/api/deleteAccount', { form: { email: <fixture email>, password: <fixture password> } })`.
    - expect: The deleteAccount response body's `responseCode` equals 200 and `message` equals 'Account deleted!', confirming the fixture account created for this test is not left orphaned on the live site.

#### 2.2. POST /api/verifyLogin missing the email parameter returns the documented missing-parameter error

**File:** `tests/api/login.spec.ts`

**Steps:**
  1. Send `request.post('/api/verifyLogin', { form: { password: 'anyPassword123' } })` — no `email` key present in the form body at all.
    - expect: `response.status()` equals 200.
    - expect: The parsed JSON body's `responseCode` field equals exactly 400.
    - expect: `body.message` equals exactly the string 'Bad request, email or password parameter is missing in POST request.'

#### 2.3. POST /api/verifyLogin missing the password parameter returns the identical missing-parameter error as the missing-email case

**File:** `tests/api/login.spec.ts`

**Steps:**
  1. Send `request.post('/api/verifyLogin', { form: { email: 'someone@example.com' } })` — no `password` key present in the form body at all.
    - expect: `response.status()` equals 200.
    - expect: The parsed JSON body's `responseCode` field equals exactly 400 and `message` equals exactly 'Bad request, email or password parameter is missing in POST request.' — the SAME message text as the missing-email case, confirming the API does not distinguish which of the two params was omitted (this was independently confirmed live for both variants during planning).

#### 2.4. GET /api/verifyLogin (unsupported method) returns a 405 responseCode

**File:** `tests/api/login.spec.ts`

**Steps:**
  1. Send `request.get('/api/verifyLogin')`.
    - expect: `response.status()` equals 200 (transport status).
    - expect: The parsed JSON body's `responseCode` field equals exactly 405.
    - expect: `body.message` equals exactly the string 'This request method is not supported.' — matching the exact same message text already asserted in the existing `products.spec.ts`/`brands.spec.ts` method-not-supported cases, confirming this is a shared platform-wide error string, not endpoint-specific text.

#### 2.5. POST /api/verifyLogin with an existing email but wrong password returns User not found (distinct from the missing-param 400 case)

**File:** `tests/api/login.spec.ts`

**Steps:**
  1. Setup: register a unique fixture account via `request.post('/api/createAccount', ...)` with all required fields. Confirm `responseCode: 201` before proceeding.
    - expect: createAccount response body `responseCode` equals 201, confirming the fixture account exists.
  2. Send `request.post('/api/verifyLogin', { form: { email: <fixture email>, password: 'DeliberatelyWrongPassword999!' } })` — a syntactically valid but incorrect password for that real account.
    - expect: `response.status()` equals 200.
    - expect: The parsed JSON body's `responseCode` field equals exactly 404 (NOT 400 — this is the distinguishing assertion versus the missing-parameter scenarios above, and NOT 200 — distinguishing it from the valid-login scenario).
    - expect: `body.message` equals exactly the string 'User not found!'
  3. Cleanup: `request.delete('/api/deleteAccount', { form: { email: <fixture email>, password: <fixture password> } })` using the ORIGINAL correct password (not the wrong one used in the negative-test step).
    - expect: deleteAccount response body `responseCode` equals 200 and `message` equals 'Account deleted!', confirming no fixture account from this test is left orphaned.

### 3. Account Management API (createAccount / updateAccount / deleteAccount / getUserDetailByEmail)

**Seed:** `tests/seed.spec.ts`

#### 3.1. POST /api/createAccount with all required fields creates a new account, confirmed retrievable via getUserDetailByEmail

**File:** `tests/api/account.spec.ts`

**Steps:**
  1. Generate a unique test user (unique email per run) and send `request.post('/api/createAccount', { form: { name, email, password, title: 'Mr', birth_date: '10', birth_month: 'May', birth_year: '1990', firstname, lastname, company, address1, address2: '', country: 'United States', zipcode, state, city, mobile_number } })` with all 17 documented fields populated (address2 may be an empty string, all others non-empty).
    - expect: `response.status()` equals 200.
    - expect: The parsed JSON body's `responseCode` field equals exactly 201.
    - expect: `body.message` equals exactly the string 'User created!'
  2. Send `request.get('/api/getUserDetailByEmail', { params: { email: <the same fixture email> } })`.
    - expect: `response.status()` equals 200 and body `responseCode` equals 200.
    - expect: `body.user.email` equals exactly the fixture email used at creation.
    - expect: `body.user.name` equals exactly the `name` value sent at creation, `body.user.first_name` equals the `firstname` value sent (note the field-name mismatch: request used `firstname`, response returns `first_name`), and `body.user.title` equals the `title` value sent — confirming the created record's data round-trips correctly rather than merely confirming a 200 status.
  3. Cleanup: `request.delete('/api/deleteAccount', { form: { email, password } })` using the fixture account's own credentials.
    - expect: deleteAccount response body `responseCode` equals 200 and `message` equals 'Account deleted!'.

#### 3.2. POST /api/createAccount missing a required field (email) returns a field-specific 400 error

**File:** `tests/api/account.spec.ts`

**Steps:**
  1. Send `request.post('/api/createAccount', { form: {...all documented fields except email, i.e. no `email` key at all...} })`.
    - expect: `response.status()` equals 200.
    - expect: The parsed JSON body's `responseCode` field equals exactly 400.
    - expect: `body.message` equals exactly the string 'Bad request, email parameter is missing in POST request.' — confirming the error message names the specific missing field rather than a generic 'a parameter is missing' text (this was confirmed live: omitting `email` specifically produces a message naming 'email').
  2. No cleanup needed: confirm no account was actually created by attempting `request.post('/api/verifyLogin', { form: { email: 'irrelevant-since-no-email-was-sent@example.com', password: 'x' } })` is unnecessary here since no email value was ever sent; instead simply assert nothing else about persistence is required for this negative case (the 400 responseCode itself is sufficient proof no record was created, matching this API's documented contract).
    - expect: No further assertion required beyond the 400/message check above — this step exists only to document that no cleanup/orphan risk applies to this scenario since account creation did not succeed.

#### 3.3. PUT /api/updateAccount updates an existing account's fields, confirmed via a follow-up getUserDetailByEmail

**File:** `tests/api/account.spec.ts`

**Steps:**
  1. Setup: create a unique fixture account via `request.post('/api/createAccount', ...)` with an initial field set (e.g. title 'Mr', firstname 'Original', city 'San Francisco', zipcode '94107'). Confirm `responseCode: 201`.
    - expect: createAccount response `responseCode` equals 201, confirming the fixture account exists before the update is attempted.
  2. Send `request.put('/api/updateAccount', { form: { ...same email, same or new password, and a DIFFERENT value for every other field, e.g. title: 'Mrs', firstname: 'Updated', city: 'Toronto', zipcode: '90001', country: 'Canada'... } })`.
    - expect: `response.status()` equals 200.
    - expect: The parsed JSON body's `responseCode` field equals exactly 200.
    - expect: `body.message` equals exactly the string 'User updated!'
  3. Send `request.get('/api/getUserDetailByEmail', { params: { email: <the fixture email> } })` to verify the update actually persisted.
    - expect: `body.user.title` equals the NEW value sent in the update ('Mrs'), NOT the original creation-time value ('Mr').
    - expect: `body.user.first_name` equals the NEW value sent in the update ('Updated'), NOT the original ('Original').
    - expect: `body.user.city` equals the NEW value ('Toronto') and `body.user.country` equals the NEW value ('Canada') — confirming the PUT actually mutated the stored record rather than the 200/'User updated!' response being returned regardless of whether data changed.
  4. Cleanup: `request.delete('/api/deleteAccount', { form: { email, password } })`.
    - expect: deleteAccount response body `responseCode` equals 200 and `message` equals 'Account deleted!', confirming no fixture account from this test is left orphaned.

#### 3.4. DELETE /api/deleteAccount removes an existing account, confirmed via a follow-up verifyLogin returning User not found

**File:** `tests/api/account.spec.ts`

**Steps:**
  1. Setup: create a unique fixture account via `request.post('/api/createAccount', ...)`. Confirm `responseCode: 201`.
    - expect: createAccount response `responseCode` equals 201.
  2. Send `request.delete('/api/deleteAccount', { form: { email: <fixture email>, password: <fixture password> } })`.
    - expect: `response.status()` equals 200.
    - expect: The parsed JSON body's `responseCode` field equals exactly 200.
    - expect: `body.message` equals exactly the string 'Account deleted!'
  3. Send `request.post('/api/verifyLogin', { form: { email: <the just-deleted fixture email>, password: <its original password> } })` to prove the deletion was real and permanent, not just a 200 response with no actual effect.
    - expect: The verifyLogin response body's `responseCode` equals exactly 404 and `message` equals exactly 'User not found!' — proving the account record no longer exists (this doubles as the test's own confirmation that no fixture account is left behind, so no separate cleanup step is needed for this scenario).

#### 3.5. GET /api/getUserDetailByEmail for a non-existent email returns a 404 responseCode with the documented not-found message

**File:** `tests/api/account.spec.ts`

**Steps:**
  1. Send `request.get('/api/getUserDetailByEmail', { params: { email: 'definitely.does.not.exist.' + Date.now() + '@example.com' } })` using a freshly generated, guaranteed-unregistered email (timestamp-suffixed, never used by createAccount in this run).
    - expect: `response.status()` equals 200.
    - expect: The parsed JSON body's `responseCode` field equals exactly 404.
    - expect: `body.message` equals exactly the string 'Account not found with this email, try another email!'
