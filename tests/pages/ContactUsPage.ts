import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the AutomationExercise '/contact_us' page's single "Get In Touch" form
 * (Name, Email, Subject, Message, file upload, Submit). Extends BasePage to reuse the
 * shared header/nav locators.
 *
 * CONFIRMED LIVE FACTS (see specs/contact.plan.md for full detail):
 * - All fields except the file input carry a `data-qa` attribute; the file input
 *   (`name="upload_file"`) does not, so it is scoped via `#contact-us-form` instead.
 * - Email is the ONLY required field (and the only one with `type="email"`); Name,
 *   Subject and Message have no required/maxlength/minlength constraints.
 * - Clicking Submit on a form that passes client-side validation triggers a native
 *   `window.confirm()` dialog reading exactly "Press OK to proceed!" BEFORE the real
 *   POST occurs. A handler MUST be registered before the click or the test will hang.
 * - The `.status.alert.alert-success` div is present in the DOM at all times (hidden via
 *   inline `display: none`), NOT inserted only on success -- so its absence/presence cannot
 *   be checked with `toHaveCount`. Accepting the dialog makes it visible (exact text
 *   "Success! Your details have been submitted successfully.") alongside a Home button;
 *   declining it leaves the form, the alert's hidden state, and the entered values
 *   completely unchanged.
 */
export class ContactUsPage extends BasePage {
  readonly getInTouchHeading: Locator;

  readonly contactForm: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly subjectInput: Locator;
  readonly messageTextarea: Locator;
  readonly fileInput: Locator;
  readonly submitButton: Locator;

  readonly successAlert: Locator;
  readonly successHomeButton: Locator;

  constructor(page: Page) {
    super(page);

    this.getInTouchHeading = page.getByRole('heading', { name: 'Get In Touch' });

    this.contactForm = page.locator('#contact-us-form');
    this.nameInput = page.locator('[data-qa="name"]');
    this.emailInput = page.locator('[data-qa="email"]');
    this.subjectInput = page.locator('[data-qa="subject"]');
    this.messageTextarea = page.locator('[data-qa="message"]');
    // The file input carries no data-qa attribute (confirmed live) -- scope by type/name
    // within the form instead.
    this.fileInput = this.contactForm.locator('input[type="file"]');
    this.submitButton = page.locator('[data-qa="submit-button"]');

    this.successAlert = page.locator('.status.alert.alert-success');
    this.successHomeButton = page.locator('a.btn.btn-success[href="/"]');
  }

  /** Navigate to '/contact_us' and wait for the "Get In Touch" form to be ready. */
  async goto() {
    await super.goto('/contact_us');
    await this.getInTouchHeading.waitFor({ state: 'visible' });
  }

  /**
   * Fill the four text fields of the "Get In Touch" form. Every field is optional so
   * callers can deliberately omit one (e.g. to exercise native validation).
   */
  async fillForm(fields: { name?: string; email?: string; subject?: string; message?: string }) {
    if (fields.name !== undefined) await this.nameInput.fill(fields.name);
    if (fields.email !== undefined) await this.emailInput.fill(fields.email);
    if (fields.subject !== undefined) await this.subjectInput.fill(fields.subject);
    if (fields.message !== undefined) await this.messageTextarea.fill(fields.message);
  }

  /** Attach a file to the (optional) upload field. */
  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  /**
   * Register a dialog listener that records every dialog's message into the returned array
   * (without accepting/dismissing it itself), so a caller can assert on the dialog message --
   * or on the absence of one -- after invoking one of the submit* methods below. Call this
   * BEFORE the submit* method whose dialog you want to observe; it coexists safely with the
   * accept/dismiss listener those methods register themselves. Extracted during cleanup once
   * this exact page.once('dialog', ...) capture pattern turned up duplicated across both
   * contact-submit.spec.ts and contact-validation.spec.ts.
   */
  captureDialogMessages(): string[] {
    const messages: string[] = [];
    this.page.on('dialog', (dialog) => {
      messages.push(dialog.message());
    });
    return messages;
  }

  /**
   * Register a one-time handler that ACCEPTS the native confirm() dialog, click Submit,
   * then wait for the success alert to appear. This is the only method in this page
   * object that performs a real, accepted submission.
   */
  async submitAndConfirm() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.submitButton.click();
    await this.successAlert.waitFor({ state: 'visible' });
  }

  /**
   * Register a one-time handler that DECLINES (dismisses) the native confirm() dialog,
   * then click Submit. No submission occurs; the form and its values are left unchanged.
   */
  async submitAndDeclineDialog() {
    this.page.once('dialog', (dialog) => dialog.dismiss());
    await this.submitButton.click();
  }

  /**
   * Click Submit with NO dialog handler registered at all -- used for the native
   * (client-side) validation scenarios where the browser is expected to block
   * submission before any confirm() dialog could ever fire.
   */
  async attemptSubmitExpectingNativeBlock() {
    await this.submitButton.click();
  }
}
