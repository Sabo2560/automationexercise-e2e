// spec: specs/contact.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ContactUsPage } from '../../pages/ContactUsPage';

test.describe('Contact Us Form', () => {
  test('Submitting with the required Email field empty is blocked by native validation', async ({ page }) => {
    const contactUsPage = new ContactUsPage(page);

    // 1. Assumptions: fresh, unauthenticated browser context. Using ContactUsPage, navigate
    // to /contact_us. Fill Name = 'Blocked Test', Subject = 'Subject', Message = 'Message
    // body', and leave Email empty. Register NO dialog handler (none should fire). Call
    // attemptSubmitExpectingNativeBlock().
    await contactUsPage.goto();
    await contactUsPage.fillForm({
      name: 'Blocked Test',
      subject: 'Subject',
      message: 'Message body',
    });

    const dialogMessages = contactUsPage.captureDialogMessages();
    await contactUsPage.attemptSubmitExpectingNativeBlock();

    const emailValidity = await contactUsPage.emailInput.evaluate((el: HTMLInputElement) => ({
      checkValidity: el.checkValidity(),
      valueMissing: el.validity.valueMissing,
    }));
    expect(emailValidity.checkValidity).toBe(false);
    expect(emailValidity.valueMissing).toBe(true);
    expect(dialogMessages).toEqual([]);
    await expect(contactUsPage.contactForm).toHaveCount(1);
    // The success alert div is always present in the DOM (hidden via inline `display: none`)
    // and only becomes visible after a real successful submission, so assert non-visibility
    // rather than absence.
    await expect(contactUsPage.successAlert).not.toBeVisible();
    await expect(page).toHaveURL('https://automationexercise.com/contact_us');
  });

  test('Submitting with an invalid email format is blocked by native validation', async ({ page }) => {
    const contactUsPage = new ContactUsPage(page);

    // 1. Assumptions: fresh, unauthenticated browser context. Using ContactUsPage, navigate
    // to /contact_us. Fill Name = 'Format Test', Email = 'notanemail' (missing '@', an
    // invalid-format representative of the invalid-input equivalence class), Subject =
    // 'Subject', Message = 'Message body'. Register NO dialog handler. Call
    // attemptSubmitExpectingNativeBlock().
    await contactUsPage.goto();
    await contactUsPage.fillForm({
      name: 'Format Test',
      email: 'notanemail',
      subject: 'Subject',
      message: 'Message body',
    });

    const dialogMessages = contactUsPage.captureDialogMessages();
    await contactUsPage.attemptSubmitExpectingNativeBlock();

    const emailValidity = await contactUsPage.emailInput.evaluate((el: HTMLInputElement) => ({
      checkValidity: el.checkValidity(),
      typeMismatch: el.validity.typeMismatch,
    }));
    expect(emailValidity.checkValidity).toBe(false);
    expect(emailValidity.typeMismatch).toBe(true);
    expect(dialogMessages).toEqual([]);
    await expect(contactUsPage.contactForm).toHaveCount(1);
    await expect(contactUsPage.emailInput).toHaveValue('notanemail');
    await expect(page).toHaveURL('https://automationexercise.com/contact_us');
  });

  test('Declining the confirm() dialog blocks submission and preserves the entered form data', async ({ page }) => {
    const contactUsPage = new ContactUsPage(page);

    // 1. Assumptions: fresh, unauthenticated browser context. Using ContactUsPage, navigate
    // to /contact_us. Fill Name = 'Decline Test', Email = 'decline@example.com', Subject =
    // 'Subject', Message = 'Message body' (a fully valid form, no file uploaded). Call
    // submitAndDeclineDialog(), which registers a handler to dismiss (decline) the confirm()
    // dialog before clicking Submit.
    await contactUsPage.goto();
    await contactUsPage.fillForm({
      name: 'Decline Test',
      email: 'decline@example.com',
      subject: 'Subject',
      message: 'Message body',
    });

    const dialogMessages = contactUsPage.captureDialogMessages();
    await contactUsPage.submitAndDeclineDialog();

    expect(dialogMessages).toEqual(['Press OK to proceed!']);
    await expect(contactUsPage.contactForm).toHaveCount(1);
    await expect(contactUsPage.nameInput).toHaveValue('Decline Test');
    await expect(contactUsPage.emailInput).toHaveValue('decline@example.com');
    // Same reasoning as above: the alert div exists in the DOM pre-submission but stays hidden.
    await expect(contactUsPage.successAlert).not.toBeVisible();
    await expect(page).toHaveURL('https://automationexercise.com/contact_us');
  });
});
