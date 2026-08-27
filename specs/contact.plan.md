# Contact Us Test Plan

## Application Overview

This plan covers the AutomationExercise "Contact Us" chunk: the `/contact_us` page's single "Get In Touch" form (Name, Email, Subject, Message, file upload, Submit) and its two possible end states (native-validation-blocked vs. successfully-submitted). This chunk has NO dependency on login/cart/account — every scenario starts from a fresh, unauthenticated visit to `/contact_us` and is fully independent.

Page Object plan: a NEW `tests/pages/ContactUsPage.ts`, extending `BasePage` (`tests/pages/BasePage.ts`, already implemented — reuses its header/footer/nav locators, does not redeclare them). No other existing page object is reused for setup since this chunk has no prerequisite state.

`ContactUsPage.ts` locators/methods needed:
- `getInTouchHeading` (`heading "Get In Touch"`) — used as the "form is ready" wait target.
- `nameInput` (`[data-qa="name"]`), `emailInput` (`[data-qa="email"]`), `subjectInput` (`[data-qa="subject"]`), `messageTextarea` (`[data-qa="message"]`) — confirmed live via `data-qa` attribute read: all four are real attributes on their respective `<input>`/`<textarea>` elements (name/subject/message are plain `type="text"`/`<textarea>`, email is `type="email"`).
- `fileInput` (`input[type="file"]`, `name="upload_file"`) — confirmed this element carries NO `data-qa` attribute (only `name`/`type` are set), so it is the one field in this form that cannot use the `[data-qa=...]` convention; use `input[type="file"]` scoped to `#contact-us-form`.
- `submitButton` (`[data-qa="submit-button"]`, actually an `<input type="submit">`).
- `contactForm` (`#contact-us-form`) — used to assert the form is replaced/removed after a successful submission.
- `successAlert` (`.status.alert.alert-success`) — confirmed exact live markup: `<div class="status alert alert-success" style="display: block;">Success! Your details have been submitted successfully.</div>`.
- `successHomeButton` (`a.btn.btn-success[href="/"]`, scoped near the success alert) — confirmed exact live markup: `<a class="btn btn-success" href="/"><span><i class="fa fa-angle-double-left"></i> Home</span></a>`.

Methods: `goto()` (navigate `/contact_us`, wait for `getInTouchHeading` visible), `fillForm({name, email, subject, message})` (fills the four text fields; each param optional so callers can omit fields deliberately for validation scenarios), `uploadFile(filePath)` (calls `setInputFiles` on `fileInput`), `submitAndConfirm()` (registers a one-time `page.once('dialog', d => d.accept())` handler BEFORE clicking `submitButton`, then clicks it, then waits for `successAlert` to become visible — this is the only method that performs a real, accepted submission), `submitAndDeclineDialog()` (registers `page.once('dialog', d => d.dismiss())` before clicking `submitButton`, used to test the decline path without ever submitting), `attemptSubmitExpectingNativeBlock()` (clicks `submitButton` with no dialog handler registered at all — used for the two native-validation scenarios where the browser is expected to block submission before any `confirm()` dialog can fire, so no handler should ever be invoked).

Confirmed technical facts from live exploration (to prevent the generator from guessing):
- All five requested `data-qa` values are confirmed live except the file input: `data-qa="name"` (input, type=text, required=false), `data-qa="email"` (input, type=email, **required=true** — this is the ONLY required field in the form), `data-qa="subject"` (input, type=text, required=false), `data-qa="message"` (textarea, required=false), `data-qa="submit-button"` (input, type=submit). The file upload input (`name="upload_file"`) has no `data-qa` attribute — confirmed via DOM query.
- No `maxlength`/`minlength` constraints exist on any of the four text fields (confirmed `maxLength`/`minLength` both read `-1`, i.e. unset, on name/email/subject/message) — there is no length-boundary behavior to test on this form; do not invent boundary-value scenarios for field length.
- The form (`#contact-us-form`, `action="/contact_us"`, `method="post"`) is a REAL server-backed form — confirmed via `browser_network_requests`: after accepting the confirm dialog on a valid submission, the network request log resets to show a fresh `GET https://automationexercise.com/contact_us => 200` as its first entry, consistent with a POST followed by a server redirect back to the same URL (POST-redirect-GET), which is how the success alert is rendered without a resubmission warning on refresh. This IS a real live-site submission with real backend effect (matches project's volume-discipline note: low-volume/inconsequential, no cleanup needed) — only ONE scenario in this plan (1.1) performs it.
- Native HTML5 validation (email field only, since it is the only field with `required` and `type="email"`): submitting with the email field empty is blocked entirely client-side — confirmed the email input's `checkValidity()` returns `false` with `validationMessage` referencing a required field (exact wording is browser-locale-dependent — e.g. observed as French "Veuillez renseigner ce champ." in this environment — so scenarios MUST assert on `checkValidity()`/`validity.valueMissing` being `true`, NOT on the literal locale-specific message text). No `confirm()` dialog appears in this case, and no network request beyond the already-loaded page occurs — submission is fully prevented before the dialog handler could ever fire.
- Submitting with email filled but in an invalid format (e.g. `notanemail`, missing `@`) is also blocked entirely client-side via the same mechanism — confirmed `checkValidity()` returns `false` with `validity.typeMismatch` true (again, assert on the validity API, not the locale-specific message text). No `confirm()` dialog appears and no submission occurs.
- CONFIRMED DIALOG BEHAVIOR (a hard requirement for this plan, not optional): when the form's client-side validation passes (i.e. email is present and well-formed), clicking Submit triggers a native `window.confirm()` dialog with the exact message "Press OK to proceed!" BEFORE the real POST occurs. Every scenario that reaches this point MUST register a `page.on('dialog', ...)` handler (via the page object methods above) before clicking Submit, or the test will hang waiting on an unhandled dialog. Accepting the dialog proceeds with the real submission (leads to the success alert); declining it (confirmed live) leaves the form completely unchanged — `#contact-us-form` still exists in the DOM, both `name` and `email` field values are preserved exactly as typed, the URL remains `/contact_us`, and no success alert appears.
- On successful submission (dialog accepted): `#contact-us-form` no longer exists anywhere in the DOM (confirmed via `querySelector` returning null) — it is fully replaced, not just hidden — by `.status.alert.alert-success` showing the exact text "Success! Your details have been submitted successfully." and a "Home" button (`a.btn.btn-success[href="/"]`) with the exact visible text "Home" (preceded by an icon).
- The file upload field is NOT required (`required=false`, confirmed via DOM read) — the happy-path scenario in this plan DOES exercise it (per task instructions, using the designated fixture `tests/fixtures/contact-upload.txt`), but no separate "submit without a file" scenario is included, since that would require a second real live-site submission purely to re-confirm a fact (file optionality) already established structurally via the DOM read above — this avoids padding real submission volume per the project's volume-discipline guidance.
- Volume discipline: exactly ONE scenario in this plan (1.1, the happy path) performs a real, accepted form submission against the live site. All other scenarios (required-field block, invalid-email block, dialog-decline) are confirmed to produce NO backend submission — they are safe to run at any frequency.

Priority legend: [P0]=Critical, [P1]=High, [P2]=Medium, [P3]=Low. Per the project's overall strategy this whole chunk is capped at P2 (a contact form is not a transactional/data-integrity path). Within that cap: the happy-path full submission (1.1) is tagged P2 as the chunk's highest-value scenario (it is the one path that must work end-to-end, including the real backend interaction and file upload). The two native-validation-block scenarios (2.1, 2.2) and the dialog-decline scenario (3.1) are tagged P3 — they guard against regressions in client-side behavior but do not touch the backend and have low impact if briefly broken.

## Test Scenarios

### 1. Contact Us Form

**Seed:** `tests/seed.spec.ts`

#### 1.1. Happy path: full valid submission with file upload succeeds

**File:** `tests/ui/contact/contact-submit.spec.ts`

**Steps:**
  1. [P2] Assumptions: fresh, unauthenticated browser context, no prior navigation. Using ContactUsPage, navigate to /contact_us (goto()).
    - expect: The 'Get In Touch' heading is visible.
    - expect: '#contact-us-form' exists in the DOM.
    - expect: The Name, Email, Subject, and Message fields are all empty (their .value is an empty string) -- confirming no pre-filled default state exists on a fresh load.
  2. Fill Name = 'Test User', Email = 'test.user@example.com', Subject = 'Test Plan Exploration Subject', Message = 'This is a test message for exploring the contact form.' via fillForm(). Upload the fixture file 'tests/fixtures/contact-upload.txt' via uploadFile(). Then call submitAndConfirm(), which registers a dialog handler to accept the confirm() dialog before clicking Submit.
    - expect: A native dialog with the exact message 'Press OK to proceed!' is observed and programmatically accepted (assert the dialog-handler callback was invoked exactly once with that message, e.g. via a captured flag/array in the test).
    - expect: After the dialog is accepted, '.status.alert.alert-success' becomes visible and its text content equals exactly 'Success! Your details have been submitted successfully.'.
    - expect: '#contact-us-form' no longer exists anywhere in the DOM (element count equals 0) -- the form is replaced, not merely hidden.
    - expect: A 'Home' button/link (a.btn.btn-success) is visible with its href attribute equal to '/'.
    - expect: The page URL is 'https://automationexercise.com/contact_us' (no client-side route change occurred; the success state is rendered in-place after the server round-trip).
  3. Click the 'Home' button.
    - expect: The resulting page URL equals 'https://automationexercise.com/' (the site's home page), confirming the post-submission Home link correctly navigates back to the homepage.

#### 1.2. Submitting with the required Email field empty is blocked by native validation

**File:** `tests/ui/contact/contact-validation.spec.ts`

**Steps:**
  1. [P3] Assumptions: fresh, unauthenticated browser context. Using ContactUsPage, navigate to /contact_us. Fill Name = 'Blocked Test', Subject = 'Subject', Message = 'Message body', and leave Email empty. Register NO dialog handler (none should fire). Call attemptSubmitExpectingNativeBlock().
    - expect: The email input's checkValidity() returns false and its validity.valueMissing property is true, confirming the browser's native required-field validation is what blocked submission (not asserting on the locale-specific validationMessage text, which is browser-language-dependent).
    - expect: No confirm() dialog is triggered (assert zero dialog events were observed during this step -- if one fired the test should fail/throw, since native validation should have blocked submission before the dialog could appear).
    - expect: '#contact-us-form' still exists in the DOM (the form was not replaced by a success alert).
    - expect: '.status.alert.alert-success' does not exist anywhere on the page.
    - expect: The page URL remains exactly 'https://automationexercise.com/contact_us' (no navigation/reload occurred).

#### 1.3. Submitting with an invalid email format is blocked by native validation

**File:** `tests/ui/contact/contact-validation.spec.ts`

**Steps:**
  1. [P3] Assumptions: fresh, unauthenticated browser context. Using ContactUsPage, navigate to /contact_us. Fill Name = 'Format Test', Email = 'notanemail' (missing '@', an invalid-format representative of the invalid-input equivalence class), Subject = 'Subject', Message = 'Message body'. Register NO dialog handler. Call attemptSubmitExpectingNativeBlock().
    - expect: The email input's checkValidity() returns false and its validity.typeMismatch property is true, confirming the browser's native email-format validation (not the required-field check) is what blocked submission.
    - expect: No confirm() dialog is triggered during this step.
    - expect: '#contact-us-form' still exists in the DOM and the email field's value remains exactly 'notanemail' (unchanged by the blocked submission attempt).
    - expect: The page URL remains exactly 'https://automationexercise.com/contact_us'.

#### 1.4. Declining the confirm() dialog blocks submission and preserves the entered form data

**File:** `tests/ui/contact/contact-validation.spec.ts`

**Steps:**
  1. [P3] Assumptions: fresh, unauthenticated browser context. Using ContactUsPage, navigate to /contact_us. Fill Name = 'Decline Test', Email = 'decline@example.com', Subject = 'Subject', Message = 'Message body' (a fully valid form, no file uploaded). Call submitAndDeclineDialog(), which registers a handler to dismiss (decline) the confirm() dialog before clicking Submit.
    - expect: A native dialog with the exact message 'Press OK to proceed!' is observed and programmatically dismissed (assert the dialog-handler callback was invoked exactly once and called dialog.dismiss(), not dialog.accept()).
    - expect: '#contact-us-form' still exists in the DOM after the dialog is dismissed (confirmed live: declining does not remove/replace the form).
    - expect: The Name field's value still equals exactly 'Decline Test' and the Email field's value still equals exactly 'decline@example.com' -- confirming the entered data is fully preserved, not cleared, after a declined submission.
    - expect: '.status.alert.alert-success' does not exist anywhere on the page.
    - expect: The page URL remains exactly 'https://automationexercise.com/contact_us' (no navigation occurred as a result of declining).
