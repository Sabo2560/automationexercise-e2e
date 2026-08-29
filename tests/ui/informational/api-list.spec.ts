// spec: specs/informational.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InformationalPage } from '../../pages/InformationalPage';

test.describe('Informational Pages - API List', () => {
  test('API List page loads with the full list of 14 documented endpoints, all collapsed by default', async ({ page }) => {
    const informationalPage = new InformationalPage(page);

    // 1. Assumptions: fresh, unauthenticated browser context, no prior navigation. Starting
    // from the home page, using InformationalPage.gotoApiList() (which clicks
    // BasePage.apiTestingNavLink), navigate to /api_list.
    await informationalPage.goto('/');
    await informationalPage.gotoApiList();
    await expect(page).toHaveURL(/\/api_list$/);
    await expect(page).toHaveTitle('Automation Practice for API Testing');
    await expect(informationalPage.pageHeading).toHaveText('APIs List for practice');
    await expect(informationalPage.introText).toContainText('Click on the scenario for detailed API');

    // 2. Query all accordionLinks (a[data-toggle="collapse"]) on the page.
    await expect(informationalPage.accordionLinks).toHaveCount(15);
    const linkTexts = await informationalPage.accordionLinks.allTextContents();
    const numberedTexts = linkTexts.slice(0, 14);
    const trailingText = linkTexts[14];
    numberedTexts.forEach((text, index) => {
      expect(text.startsWith(`API ${index + 1}:`)).toBe(true);
    });
    expect(trailingText).toBe('Feedback for Us');

    // Spot-check first ('API 1'), middle ('API 7'), and last ('API 14') items:
    // isAccordionItemCollapsed() returns true AND the corresponding panel's computed CSS
    // display equals 'none' -- confirming the default freshly-loaded state is fully
    // collapsed, not just for the first item.
    for (const linkName of ['API 1: Get All Products List', 'API 7: POST To Verify Login with valid details', 'API 14: GET user account detail by email']) {
      expect(await informationalPage.isAccordionItemCollapsed(linkName)).toBe(true);
      const panel = await informationalPage.accordionPanelFor(linkName);
      await expect(panel).toBeHidden();
    }

    // 3. Scroll to the bottom of the accordion list, below item 14, to the Feedback for Us section.
    await informationalPage.feedbackHeadingLink.scrollIntoViewIfNeeded();
    await expect(informationalPage.feedbackHeadingLink).toBeVisible();
    await expect(informationalPage.feedbackEmailLink).toBeVisible();
    await expect(informationalPage.feedbackEmailLink).toHaveText('feedback@automationexercise.com');
    await expect(informationalPage.feedbackEmailLink).toHaveAttribute('href', 'mailto:feedback@automationexercise.com');
  });

  test('Expanding representative API accordion items reveals distinct endpoint/method/response details per entry', async ({ page }) => {
    const informationalPage = new InformationalPage(page);

    // 1. Assumptions: fresh visit to /api_list via InformationalPage.gotoApiList() (same as
    // scenario 1.3, independent test run). Call expandAccordionItem('API 1: Get All Products List').
    await informationalPage.goto('/');
    await informationalPage.gotoApiList();
    const panel1 = await informationalPage.expandAccordionItem('API 1: Get All Products List');
    await expect(panel1).toBeVisible();
    await expect(panel1).toContainText('API URL: https://automationexercise.com/api/productsList');
    await expect(panel1).toContainText('Request Method: GET');
    await expect(panel1).toContainText('Response Code: 200');

    // 2. Without collapsing item 1, call expandAccordionItem('API 2: POST To All Products List')
    // (a distinct entry documenting a different HTTP method against the same underlying endpoint).
    const panel2 = await informationalPage.expandAccordionItem('API 2: POST To All Products List');
    await expect(panel2).toBeVisible();
    await expect(panel2).toContainText('Request Method: POST');
    // The #collapse1 panel from the previous step REMAINS visible at the same time, consistent
    // with the same independent multi-open accordion behavior already confirmed on the Test
    // Cases page (scenario 1.2).
    await expect(panel1).toBeVisible();
  });
});
