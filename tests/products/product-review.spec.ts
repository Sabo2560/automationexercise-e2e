// spec: specs/products.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';

test.describe('Product Review Submission', () => {
  test('Submitting a fully completed review clears the form fields (best-effort assertion; success alert visibility is unconfirmed)', async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);

    // 1. On a freshly loaded /product_details/1 page, confirm '#name', '#email', and '#review'
    // are all empty, then fill them with a test name, a syntactically valid non-personal test
    // email, and a short review string, then click '#button-review'.
    await productDetailsPage.gotoProduct(1);

    await expect(productDetailsPage.reviewNameInput).toHaveValue('');
    await expect(productDetailsPage.reviewEmailInput).toHaveValue('');
    await expect(productDetailsPage.reviewTextInput).toHaveValue('');

    await productDetailsPage.submitReview({
      name: 'QA Test Reviewer',
      email: 'test.reviewer.qa@example.com',
      review: 'Great product, exactly as described.',
    });

    // After clicking submit, '#name', '#email', and '#review' all have an empty string value.
    // NOTE: this is the only reproducible "submission was processed" signal for this form —
    // do NOT assert '#review-section' success alert visibility (unconfirmed during exploration,
    // see specs/products.plan.md section 5).
    await expect(productDetailsPage.reviewNameInput).toHaveValue('');
    await expect(productDetailsPage.reviewEmailInput).toHaveValue('');
    await expect(productDetailsPage.reviewTextInput).toHaveValue('');
  });

  test('Leaving a required review field empty blocks submission via native HTML validation', async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);
    await productDetailsPage.gotoProduct(1);

    // 1. On a freshly loaded /product_details/1 page, fill '#email' and '#review' with valid
    // values but leave '#name' empty, then click '#button-review'.
    await productDetailsPage.reviewEmailInput.fill('test.reviewer.qa@example.com');
    await productDetailsPage.reviewTextInput.fill('Great product, exactly as described.');
    await productDetailsPage.reviewSubmitButton.click();

    const nameValidity = await productDetailsPage.reviewNameInput.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      valueMissing: el.validity.valueMissing,
    }));
    expect(nameValidity.valid).toBe(false);
    expect(nameValidity.valueMissing).toBe(true);

    // The '#email' and '#review' values are unchanged/still populated, confirming no
    // submission was processed.
    await expect(productDetailsPage.reviewEmailInput).toHaveValue('test.reviewer.qa@example.com');
    await expect(productDetailsPage.reviewTextInput).toHaveValue('Great product, exactly as described.');
  });
});
