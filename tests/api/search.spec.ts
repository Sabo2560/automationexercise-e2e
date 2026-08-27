// spec: specs/api.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Search Product API', () => {
  test('POST /api/searchProduct with a valid search_product param returns matching products', async ({ request }) => {
    // 1. Send request.post('/api/searchProduct', { form: { search_product: 'Top' } })
    const response = await request.post('/api/searchProduct', {
      form: { search_product: 'Top' },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.responseCode).toBe(200);
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);

    const first = body.products[0];
    expect(typeof first.id).toBe('number');
    expect(typeof first.name).toBe('string');
    expect(typeof first.price).toBe('string');
    expect(first.price.startsWith('Rs.')).toBe(true);
    expect(typeof first.brand).toBe('string');
    expect(typeof first.category.category).toBe('string');
  });

  test('POST /api/searchProduct without the search_product param returns a 400 responseCode with the documented bad-request message', async ({ request }) => {
    // 1. Send request.post('/api/searchProduct') with no body/form data at all
    const response = await request.post('/api/searchProduct');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.responseCode).toBe(400);
    expect(body.message).toBe('Bad request, search_product parameter is missing in POST request.');
  });
});
