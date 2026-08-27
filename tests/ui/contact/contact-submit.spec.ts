// spec: specs/contact.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import path from 'path';
import { ContactUsPage } from '../../pages/ContactUsPage';

test.describe('Contact Us Form', () => {
  test('Happy path: full valid submission with file upload succeeds', async ({ page }) => {
    const contactUsPage = new ContactUsPage(page);

    // 1. Assumptions: fresh, unauthenticated browser context, no prior navigation. Using
    // ContactUsPage, navigate to /contact_us (goto()).
    await contactUsPage.goto();

    await expect(contactUsPage.getInTouchHeading).toBeVisible();
    await expect(contactUsPage.contactForm).toHaveCount(1);
    await expect(contactUsPage.nameInput).toHaveValue('');
    await expect(contactUsPage.emailInput).toHaveValue('');
    await expect(contactUsPage.subjectInput).toHaveValue('');
    await expect(contactUsPage.messageTextarea).toHaveValue('');

    // 2. Fill Name = 'Test User', Email = 'test.user@example.com', Subject = 'Test Plan
    // Exploration Subject', Message = 'This is a test message for exploring the contact
    // form.' via fillForm(). Upload the fixture file 'tests/fixtures/contact-upload.txt'
    // via uploadFile(). Then call submitAndConfirm(), which registers a dialog handler to
    // accept the confirm() dialog before clicking Submit.
    await contactUsPage.fillForm({
      name: 'Test User',
      email: 'test.user@example.com',
      subject: 'Test Plan Exploration Subject',
      message: 'This is a test message for exploring the contact form.',
    });
    await contactUsPage.uploadFile(path.join(__dirname, '..', '..', 'fixtures', 'contact-upload.txt'));

    const dialogMessages = contactUsPage.captureDialogMessages();
    await contactUsPage.submitAndConfirm();

    expect(dialogMessages).toEqual(['Press OK to proceed!']);
    await expect(contactUsPage.successAlert).toBeVisible();
    await expect(contactUsPage.successAlert).toHaveText('Success! Your details have been submitted successfully.');
    await expect(contactUsPage.contactForm).toHaveCount(0);
    await expect(contactUsPage.successHomeButton).toBeVisible();
    await expect(contactUsPage.successHomeButton).toHaveAttribute('href', '/');
    await expect(page).toHaveURL('https://automationexercise.com/contact_us');

    // 3. Click the 'Home' button.
    await contactUsPage.successHomeButton.click();

    await expect(page).toHaveURL('https://automationexercise.com/');
  });
});
