import { test, expect } from '@playwright/test';

test('GET /api/brandsList returns all brands', async ({ request }) => {
  const response = await request.get('/api/brandsList');
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.responseCode).toBe(200);
  expect(Array.isArray(body.brands)).toBe(true);
  expect(body.brands.length).toBeGreaterThan(0);
  expect(body.brands[0]).toHaveProperty('id');
  expect(body.brands[0]).toHaveProperty('brand');
});

test('PUT /api/brandsList is not supported', async ({ request }) => {
  const response = await request.put('/api/brandsList');
  const body = await response.json();

  expect(body.responseCode).toBe(405);
});
