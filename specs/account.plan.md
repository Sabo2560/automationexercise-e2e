# Account / Auth Test Plan

## Application Overview

This plan covers the AutomationExercise Account/Auth chunk: `/login` (two independent forms — "Login to your account" and "New User Signup!") and `/signup` (the full "Enter Account Information" form). In scope: register (via the two-step Signup -> Account Information flow), login (valid and invalid credentials), duplicate-email registration attempt, logout, and delete account. Out of scope: checkout/order flows (covered by the Checkout/Orders chunk, which depends on this one) and the mock payment form.

Page Object status: `tests/pages/` currently has `BasePage.ts` and `HomePage.ts` only (from the Home chunk). This chunk requires two NEW page objects, both extending `BasePage`:
- `tests/pages/LoginPage.ts` (NEW) — covers `/login`. Locators (all `[data-qa=...]`, confirmed live): `loginEmailInput` (`[data-qa="login-email"]`), `loginPasswordInput` (`[data-qa="login-password"]`), `loginButton` (`[data-qa="login-button"]`), `loginErrorMessage` (the `<p>` with red inline style rendered inside the login form after a failed attempt, text "Your email or password is incorrect!" — no distinguishing class, so scope by nearest form/heading), `signupNameInput` (`[data-qa="signup-name"]`), `signupEmailInput` (`[data-qa="signup-email"]`), `signupButton` (`[data-qa="signup-button"]`), `signupErrorMessage` (the `<p>` "Email Address already exist!" that appears in the same New User Signup section when POSTing a duplicate email — note: in that failure case the URL becomes `/signup` but the rendered page is still the login-template markup, not the Account Information form). Helper methods: `gotoLogin()` (navigate to `/login`, wait for "Login to your account" heading), `loginWithCredentials(email, password)`, `startSignup(name, email)` (fills the New User Signup mini-form and clicks Signup — the natural entry point into `SignupPage`).
- `tests/pages/SignupPage.ts` (NEW) — covers `/signup`. Locators (all `[data-qa=...]`, confirmed live): `titleMrRadio`/`titleMrsRadio` (`#id_gender1`/`#id_gender2`, wrapped by two `[data-qa="title"]` divs), `nameInput` (`[data-qa="name"]`, pre-filled and editable), `emailInput` (`[data-qa="email"]`, pre-filled and disabled — carried over from the `/login` Signup mini-form), `passwordInput` (`[data-qa="password"]`), `daySelect`/`monthSelect`/`yearSelect` (`[data-qa="days"]`/`months`/`years`), `newsletterCheckbox`, `specialOffersCheckbox`, `firstNameInput` (`[data-qa="first_name"]`), `lastNameInput` (`[data-qa="last_name"]`), `companyInput` (`[data-qa="company"]`), `addressInput` (`[data-qa="address"]`), `address2Input` (`[data-qa="address2"]`), `countrySelect` (`[data-qa="country"]`), `stateInput` (`[data-qa="state"]`), `cityInput` (`[data-qa="city"]`), `zipcodeInput` (`[data-qa="zipcode"]`), `mobileNumberInput` (`[data-qa="mobile_number"]`), `createAccountButton` (`[data-qa="create-account"]`). Helper method: `fillAccountInformation({...})` accepting an options object covering the required fields (title, password, dob, first/last name, address, country, state, city, zipcode, mobile) with sensible test defaults, then `submit()`. Also needed: locators for the post-submit `/account_created` page (`accountCreatedHeading`, `continueButton` -> both this and `/delete_account` land on similar "Account Created!"/"Account Deleted!" template markup, so these can live on `SignupPage` or a small shared `AccountStatusPage` helper — recommend keeping them as extra locators on `SignupPage` since no other chunk needs them yet) and for the logged-in header state inherited via `BasePage` additions below.
- `tests/pages/BasePage.ts` (UPDATE, not new) — needs two additions since they only exist once logged in: `logoutNavLink` (header link " Logout" -> `/logout`), `deleteAccountNavLink` (header link " Delete Account" -> `/delete_account`), and `loggedInAsText` (header list item containing "Logged in as {name}"). These belong on `BasePage` (not `LoginPage`/`SignupPage`) because they appear in the shared header on every page once authenticated, matching the existing convention that header/nav locators live on the base class.

Confirmed technical facts from live exploration (to prevent the generator from guessing):
- `/login` has exactly the two forms described above; both are plain HTML `<form>` POSTs causing full page reloads (not SPA/XHR) — confirmed no matching XHR/fetch request appears for the login POST; behavior is asserted via resulting DOM/URL state, not network capture. No API-level test coverage applies to this chunk beyond what already exists in `tests/api/**` for account endpoints (out of scope here).
- Invalid login credentials: submitting the Login form with a non-existent email/wrong password re-renders `/login` (URL unchanged) with a red-text `<p>Your email or password is incorrect!</p>` inserted directly after the password field, inside the "Login to your account" form section, and both entered field values are preserved.
- Valid login: submitting with correct credentials navigates to `/` and the header changes from "Signup / Login" to three items: "Logout" (`/logout`), "Delete Account" (`/delete_account`), and a text node "Logged in as {Name}" (Name = whatever was entered in the original Signup mini-form).
- New User Signup mini-form (`signup-name`/`signup-email`) — both inputs are HTML `required`; submitting navigates to `/signup` and pre-fills the Account Information form's Name (editable) and Email (disabled) fields with the values just entered.
- Signup with an email that already belongs to a registered account: submitting the New User Signup mini-form with an existing email does NOT navigate to the full Account Information form. Instead the resulting page URL is `/signup` but the rendered markup is the same login-page template, with a `<p>Email Address already exist!</p>` inserted directly after the Email field in the New User Signup section (both entered Name and Email values preserved). Confirmed live using a real fixture account created and deleted within this same exploration session.
- `/signup` Enter Account Information form fields, confirmed present with exactly these `data-qa` values: `title` (two radio-wrapping divs, not directly clickable — the actual radios are `#id_gender1`/`#id_gender2` with accessible names "Mr."/"Mrs."), `name`, `email` (disabled), `password`, `days`/`months`/`years` (native `<select>`, default selected options are the literal placeholder text "Day"/"Month"/"Year", not a real date), `first_name`, `last_name`, `company` (optional, no asterisk), `address`, `address2` (optional), `country` (`<select>`, default selected option "India", other options: United States, Canada, Australia, Israel, New Zealand, Singapore), `state`, `city`, `zipcode`, `mobile_number`, `create-account`. All fields except Email, Company, Address 2, and the two checkboxes carry a red asterisk indicating required.
- Submitting a fully completed Account Information form navigates to `/account_created`, showing heading "Account Created!" and paragraph text "Congratulations! Your new account has been successfully created!", plus a "Continue" link to `/`. Clicking Continue lands on `/` already logged in (header shows Logout/Delete Account/"Logged in as {Name}" immediately, no separate login step needed).
- Logout: clicking the header "Logout" link (or navigating to `/logout` directly) navigates to `/login` and the header reverts to the logged-out state ("Signup / Login" link only, both forms present and empty).
- Delete Account: navigating to `/delete_account` while logged in (via the header link or direct navigation) deletes the account immediately with NO confirmation prompt/dialog, and navigates to a page showing heading "Account Deleted!" and paragraph text "Your account has been permanently deleted!", plus a "Continue" link to `/`. The header on this page already reflects the logged-out state. This was confirmed twice live (once for the main registration-flow account, once for the duplicate-email fixture account), and both test accounts created during this planning pass were deleted before finishing — no orphaned accounts were left on the shared public site.
- No seed/reset API exists; every test that registers a real account must generate a unique email per run (timestamp/random suffix) and must delete that account by the end of the test (via the Delete Account flow) wherever the scenario's flow allows it.

Priority legend: [P0]=Critical, [P1]=High, [P2]=Medium, [P3]=Low. Rationale: registration and login are P0 because every downstream transactional chunk (Cart checkout, order history) is gated behind having a logged-in session — if these break, no other authenticated flow can be tested or used. Logout and Delete Account are P1: important for session-hygiene and cleanup correctness, and Delete Account specifically prevents orphaned-account accumulation across the whole suite, but a break here doesn't block other users from transacting. Duplicate-email handling is P1 as a core validation rule protecting data integrity of the account system. Missing-required-field validation is P2/P3 boundary coverage, not a primary journey.

## Test Scenarios

### 1. Login

**Seed:** `tests/seed.spec.ts`

#### 1.1. Invalid login credentials show an inline error and do not authenticate

**File:** `tests/account/login.spec.ts`

**Steps:**
  1. Navigate to https://automationexercise.com/login (fresh/blank browser state, not logged in). Confirm both the 'Login to your account' email/password fields and the 'New User Signup!' name/email fields are present and empty (no pre-filled default values were observed during exploration).
    - expect: The 'Login to your account' heading and 'New User Signup!' heading are both visible.
    - expect: Both login inputs (data-qa='login-email', data-qa='login-password') are empty strings.
  2. Fill data-qa='login-email' with a syntactically valid but non-existent email (e.g. a timestamp-suffixed address that has never been registered) and data-qa='login-password' with any non-empty string, then click data-qa='login-button'.
    - expect: The resulting page URL is still exactly '/login' (no navigation occurred).
    - expect: A paragraph element with the exact text 'Your email or password is incorrect!' is visible inside the Login form section.
    - expect: The header nav still shows a 'Signup / Login' link (not 'Logout'/'Delete Account'), confirming the user was not authenticated.

#### 1.2. Valid login authenticates and updates the header to the logged-in state

**File:** `tests/account/login.spec.ts`

**Steps:**
  1. Using a fixture account created via the Signup flow at the start of this test (unique email/password generated for this run), navigate to /login, fill data-qa='login-email' and data-qa='login-password' with that account's credentials, and click data-qa='login-button'.
    - expect: The resulting page URL equals '/' (home page).
    - expect: The header nav no longer shows 'Signup / Login'; it instead shows a 'Logout' link (href '/logout'), a 'Delete Account' link (href '/delete_account'), and text containing 'Logged in as {the fixture account's registered name}'.
  2. Clean up: navigate to /delete_account to remove the fixture account created for this test.
    - expect: The resulting page shows heading 'Account Deleted!' confirming the account no longer exists on the site.

#### 1.3. Missing email or password on the login form is blocked before submission (native required-field validation)

**File:** `tests/account/login-validation.spec.ts`

**Steps:**
  1. On a freshly loaded /login page, leave data-qa='login-email' empty, fill data-qa='login-password' with any value, and click data-qa='login-button'.
    - expect: The page URL remains '/login' and no 'incorrect' error paragraph appears (the native browser validation blocks submission before any request is made).
    - expect: Evaluating the email input's ValidityState shows 'valid' is false and 'valueMissing' is true, confirming the block is due to the HTML 'required' attribute rather than a server-side error.

### 2. Registration

**Seed:** `tests/seed.spec.ts`

#### 2.1. Full registration flow: New User Signup -> Account Information -> Account Created -> logged in

**File:** `tests/account/register.spec.ts`

**Steps:**
  1. Navigate to /login (fresh/blank state). In the 'New User Signup!' section, fill data-qa='signup-name' with a test name and data-qa='signup-email' with a newly generated unique email (timestamp/random suffix), then click data-qa='signup-button'.
    - expect: The resulting page URL equals '/signup'.
    - expect: The 'Enter Account Information' heading is visible.
    - expect: The data-qa='name' input's value equals the name just entered, and it is editable (not disabled).
    - expect: The data-qa='email' input's value equals the email just entered, and it IS disabled (read-only, carried over from the previous step).
  2. Complete all required Account Information fields: select the 'Mr.' title radio, fill data-qa='password' with a test password, select a day/month/year from the data-qa='days'/'months'/'years' selects, fill data-qa='first_name', data-qa='last_name', data-qa='address', select a country from data-qa='country', fill data-qa='state', data-qa='city', data-qa='zipcode', and data-qa='mobile_number'. Leave optional fields (Company, Address 2, both newsletter checkboxes) untouched. Click data-qa='create-account'.
    - expect: The resulting page URL equals '/account_created'.
    - expect: A heading with the exact text 'Account Created!' is visible.
    - expect: A paragraph containing the exact text 'Congratulations! Your new account has been successfully created!' is visible.
    - expect: A 'Continue' link is visible.
  3. Click the 'Continue' link.
    - expect: The resulting page URL equals '/' (home page).
    - expect: The header nav shows 'Logout' and 'Delete Account' links and text containing 'Logged in as {the name entered in step 1}', confirming the newly created account is already authenticated with no separate login step required.
  4. Clean up: navigate to /delete_account to remove the account created in this test.
    - expect: The resulting page shows heading 'Account Deleted!' and paragraph text 'Your account has been permanently deleted!', and the header reverts to the logged-out 'Signup / Login' state — confirming no account is orphaned by this test.

#### 2.2. Registering with an email that already belongs to an existing account is rejected with an inline error

**File:** `tests/account/register.spec.ts`

**Steps:**
  1. Setup (within this same test, so the fixture is self-contained): create a real account via the full New User Signup -> Account Information -> Account Created flow using a freshly generated unique email, then log out via the header 'Logout' link so the session is clean.
    - expect: After logout, the resulting page URL equals '/login' and the header shows the logged-out 'Signup / Login' state.
  2. On the /login page, fill the 'New User Signup!' data-qa='signup-name' with any name and data-qa='signup-email' with the SAME email used in the setup step above (the one already registered), then click data-qa='signup-button'.
    - expect: The resulting page URL equals '/signup', but the rendered content is still the login-page template (the 'Login to your account' heading is present, NOT the 'Enter Account Information' form).
    - expect: A paragraph with the exact text 'Email Address already exist!' is visible in the New User Signup section, immediately after the email field.
    - expect: The data-qa='signup-email' input's value still equals the duplicate email that was submitted (value preserved, not cleared).
  3. Clean up: log in with the fixture account's original credentials (email from the setup step, its password) and navigate to /delete_account.
    - expect: Login succeeds (resulting URL '/', logged-in header state shown) and the subsequent Delete Account step shows heading 'Account Deleted!', confirming the fixture account created for this test is not left orphaned.

#### 2.3. Leaving a required Account Information field empty blocks Create Account submission (native required-field validation)

**File:** `tests/account/register-validation.spec.ts`

**Steps:**
  1. Reach the /signup Account Information form via the New User Signup mini-form (unique test email). Fill every required field EXCEPT data-qa='first_name' (leave it empty), then click data-qa='create-account'.
    - expect: The resulting page URL remains '/signup' (no navigation to '/account_created' occurs).
    - expect: Evaluating the data-qa='first_name' input's ValidityState shows 'valid' is false and 'valueMissing' is true, confirming native HTML 'required' validation (the input has the 'required' attribute) blocked submission rather than a server round-trip.

### 3. Logout and Delete Account

**Seed:** `tests/seed.spec.ts`

#### 3.1. Logout ends the session and reverts the header to the logged-out state

**File:** `tests/account/logout.spec.ts`

**Steps:**
  1. Set up by registering a fresh account via the full Signup -> Account Information flow (unique email) so the browser is in a logged-in state. Confirm the header shows 'Logged in as {name}' before proceeding.
    - expect: Header shows 'Logout' and 'Delete Account' links and 'Logged in as {name}' text prior to the logout action.
  2. Click the header 'Logout' link.
    - expect: The resulting page URL equals '/login'.
    - expect: The header no longer shows 'Logout', 'Delete Account', or 'Logged in as' text; it shows only the 'Signup / Login' link, matching the logged-out state observed on first page load.
    - expect: Both the Login and New User Signup form fields on the resulting /login page are empty (fresh form, not carrying over any prior session data).
  3. Clean up: log back in with the account's credentials and navigate to /delete_account.
    - expect: The account is deleted (heading 'Account Deleted!' shown), leaving no orphaned account from this test.

#### 3.2. Delete Account permanently removes the account and immediately logs the user out

**File:** `tests/account/delete-account.spec.ts`

**Steps:**
  1. Set up by registering a fresh account via the full Signup -> Account Information flow (unique email), confirming the post-registration logged-in state (header shows 'Logged in as {name}').
    - expect: Registration completes and the header confirms the logged-in state before the delete action is attempted.
  2. Click the header 'Delete Account' link (or navigate directly to /delete_account).
    - expect: No confirmation dialog/prompt appears before the deletion takes effect (this was confirmed during exploration — deletion is immediate on navigation, not gated behind a native `confirm()` or modal).
    - expect: The resulting page shows a heading with the exact text 'Account Deleted!' and a paragraph with the exact text 'Your account has been permanently deleted!', plus a 'Continue' link to '/'.
    - expect: The header on this page already reflects the logged-out state (no 'Logout'/'Delete Account'/'Logged in as' present).
  3. Attempt to log back in at /login using the just-deleted account's exact email/password.
    - expect: The login attempt fails with the same inline error paragraph 'Your email or password is incorrect!' used for any invalid-credentials case, confirming the account record no longer exists (this doubles as end-to-end proof of permanent deletion, and requires no further cleanup since the account is already gone).
