// spec: specs/navigation.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';

test.describe('Static Header Nav Contract', () => {
  test('Video Tutorials nav link points at the correct external destination and is never followed', async ({ page }) => {
    const homePage = new HomePage(page);

    // 1. Assume a fresh, unauthenticated context. Instantiate HomePage, navigate to '/' via gotoHome().
    // Locate videoTutorialsNavLink and read its href attribute via the new BasePage.getHref(link)
    // helper - do NOT click this link at any point in this test.
    await homePage.gotoHome();
    const href = await homePage.getHref(homePage.videoTutorialsNavLink);

    expect(href).toBe('https://www.youtube.com/c/AutomationExercise');
    await expect(page).toHaveURL('/');
  });
});
