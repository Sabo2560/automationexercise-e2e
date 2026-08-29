// spec: specs/informational.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InformationalPage } from '../../pages/InformationalPage';

test.describe('Informational Pages - Test Cases', () => {
  test('Test Cases page loads with the full list of 26 entries, all collapsed by default', async ({ page }) => {
    const informationalPage = new InformationalPage(page);

    // 1. Assumptions: fresh, unauthenticated browser context, no prior navigation. Starting
    // from the home page, using InformationalPage.gotoTestCases() (which clicks
    // BasePage.testCasesNavLink), navigate to /test_cases.
    await informationalPage.goto('/');
    await informationalPage.gotoTestCases();
    await expect(page).toHaveURL(/\/test_cases$/);
    await expect(page).toHaveTitle('Automation Practice Website for UI Testing - Test Cases');
    await expect(informationalPage.pageHeading).toHaveText('Test Cases');
    await expect(informationalPage.introText).toContainText('Click on the scenario for detailed Test Steps');

    // 2. Query all accordionLinks (a[data-toggle="collapse"]) on the page.
    await expect(informationalPage.accordionLinks).toHaveCount(27);
    const linkTexts = await informationalPage.accordionLinks.allTextContents();
    const numberedTexts = linkTexts.slice(0, 26);
    const trailingText = linkTexts[26];
    numberedTexts.forEach((text, index) => {
      expect(text.startsWith(`Test Case ${index + 1}:`)).toBe(true);
    });
    expect(trailingText).toBe('Feedback for Us');

    // Spot-check first ('Test Case 1'), middle ('Test Case 13'), and last ('Test Case 26')
    // items: isAccordionItemCollapsed() returns true AND the corresponding panel's computed
    // CSS display equals 'none' -- confirming the default freshly-loaded state is fully
    // collapsed, not just for the first item.
    for (const linkName of ['Test Case 1: Register User', 'Test Case 13: Verify Product quantity in Cart', "Test Case 26: Verify Scroll Up without 'Arrow' button and Scroll Down functionality"]) {
      expect(await informationalPage.isAccordionItemCollapsed(linkName)).toBe(true);
      const panel = await informationalPage.accordionPanelFor(linkName);
      await expect(panel).toBeHidden();
    }

    // 3. Scroll to the bottom of the accordion list, below item 26, to the Feedback for Us section.
    await informationalPage.feedbackHeadingLink.scrollIntoViewIfNeeded();
    await expect(informationalPage.feedbackHeadingLink).toBeVisible();
    await expect(informationalPage.feedbackEmailLink).toBeVisible();
    await expect(informationalPage.feedbackEmailLink).toHaveText('feedback@automationexercise.com');
    await expect(informationalPage.feedbackEmailLink).toHaveAttribute('href', 'mailto:feedback@automationexercise.com');
  });

  test('Expanding Test Cases accordion items reveals step content, supports independent multi-open state, and re-collapses on a second click', async ({ page }) => {
    const informationalPage = new InformationalPage(page);

    // 1. Assumptions: fresh visit to /test_cases via InformationalPage.gotoTestCases() (same
    // as scenario 1.1, independent test run). Call expandAccordionItem('Test Case 1: Register User').
    await informationalPage.goto('/');
    await informationalPage.gotoTestCases();
    const panel1 = await informationalPage.expandAccordionItem('Test Case 1: Register User');
    await expect(panel1).toBeVisible();
    const panel1Steps = panel1.locator('li');
    await expect(panel1Steps.first()).toHaveText('1. Launch browser');
    await expect(panel1Steps.nth(1)).toContainText('Navigate to url');
    await expect(panel1Steps.nth(1)).toContainText('automationexercise.com');
    expect(await informationalPage.isAccordionItemCollapsed('Test Case 1: Register User')).toBe(false);

    // 2. Without collapsing item 1, call expandAccordionItem('Test Case 7: Verify Test Cases Page').
    const panel7 = await informationalPage.expandAccordionItem('Test Case 7: Verify Test Cases Page');
    await expect(panel7).toBeVisible();
    // The #collapse1 panel from the previous step REMAINS visible at the same time --
    // confirming these accordion items expand independently (not a single-open accordion group).
    await expect(panel1).toBeVisible();
    const panel1Text = await panel1.textContent();
    const panel7Text = await panel7.textContent();
    expect(panel7Text).not.toBe(panel1Text);

    // 3. Call expandAccordionItem('Test Case 1: Register User') a second time (re-clicking the
    // same, already-open header link).
    await informationalPage.expandAccordionItem('Test Case 1: Register User');
    await expect(panel1).toBeHidden();
    // The #collapse7 panel (not re-clicked in this step) remains visible and unaffected.
    await expect(panel7).toBeVisible();
  });
});
