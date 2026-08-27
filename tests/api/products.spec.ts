import { test, expect } from '@playwright/test';

test.describe('Products API', () => {
  test('GET /api/productsList returns all products', async ({ request }) => {
    const response = await request.get('/api/productsList');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.responseCode).toBe(200);
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);

    const first = body.products[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('price');
    expect(first).toHaveProperty('brand');
    expect(first).toHaveProperty('category');
  });

  test('POST /api/productsList is not supported', async ({ request }) => {
    const response = await request.post('/api/productsList');
    const body = await response.json();

    expect(body.responseCode).toBe(405);
    expect(body.message).toBe('This request method is not supported.');
  });
});
