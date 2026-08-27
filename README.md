# AutomationExercise E2E

Playwright E2E suite for `https://automationexercise.com/`. See `specs/test-plan.md` for the
committed test strategy (scope, chunk breakdown, priority order, and shared conventions) and
`specs/<chunk>.plan.md` for each chunk's implementation-ready scenario plan.

## Known Site Findings

Genuine site defects (invalid/duplicate HTML, mislabeled UI, broken interactions) discovered while
building this suite are tracked here. UX quirks or design choices that are not defects are documented
in `specs/test-plan.md` instead, not listed here.

None found yet across the Home Page, Account/Auth, Product Catalog & Search, Cart, Checkout/Orders, and
Contact Us chunks. (One unconfirmed observation from Product Catalog & Search — the product review form's success
alert never became visible in any exploration/generation attempt — is not listed here because its
classification as a genuine defect vs. an anti-automation gate is not yet clear; see
`specs/test-plan.md` §7. A second unconfirmed observation from Checkout/Orders — occasional
chromium-only clicks on "Proceed To Checkout" appearing to be swallowed by a transient overlay — is
likewise not listed here, since that root cause was never independently re-confirmed live; see
`specs/test-plan.md` §9.)
