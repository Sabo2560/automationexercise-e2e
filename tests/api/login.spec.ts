// spec: specs/api.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { generateFixtureAccount } from './testData';

test.describe('Verify Login API', () => {
  test('POST /api/verifyLogin with valid credentials of a real (fixture) account returns User exists', async ({ request }) => {
    // 1. Setup: generate a unique test user and register it via request.post('/api/createAccount', ...)
    const fixture = generateFixtureAccount();
    const createResponse = await request.post('/api/createAccount', { form: fixture });
    const createBody = await createResponse.json();
    expect(createBody.responseCode).toBe(201);
    expect(createBody.message).toBe('User created!');

    try {
      // 2. Send request.post('/api/verifyLogin', { form: { email, password } })
      const response = await request.post('/api/verifyLogin', {
        form: { email: fixture.email, password: fixture.password },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.responseCode).toBe(200);
      expect(body.message).toBe('User exists!');
    } finally {
      // 3. Cleanup: send request.delete('/api/deleteAccount', { form: { email, password } })
      const deleteResponse = await request.delete('/api/deleteAccount', {
        form: { email: fixture.email, password: fixture.password },
      });
      const deleteBody = await deleteResponse.json();
      expect(deleteBody.responseCode).toBe(200);
      expect(deleteBody.message).toBe('Account deleted!');
    }
  });

  test('POST /api/verifyLogin missing the email parameter returns the documented missing-parameter error', async ({ request }) => {
    // 1. Send request.post('/api/verifyLogin', { form: { password: 'anyPassword123' } }) — no email key present
    const response = await request.post('/api/verifyLogin', {
      form: { password: 'anyPassword123' },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.responseCode).toBe(400);
    expect(body.message).toBe('Bad request, email or password parameter is missing in POST request.');
  });

  test('POST /api/verifyLogin missing the password parameter returns the identical missing-parameter error as the missing-email case', async ({ request }) => {
    // 1. Send request.post('/api/verifyLogin', { form: { email: 'someone@example.com' } }) — no password key present
    const response = await request.post('/api/verifyLogin', {
      form: { email: 'someone@example.com' },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.responseCode).toBe(400);
    expect(body.message).toBe('Bad request, email or password parameter is missing in POST request.');
  });

  test('GET /api/verifyLogin (unsupported method) returns a 405 responseCode', async ({ request }) => {
    // 1. Send request.get('/api/verifyLogin')
    const response = await request.get('/api/verifyLogin');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.responseCode).toBe(405);
    expect(body.message).toBe('This request method is not supported.');
  });

  test('POST /api/verifyLogin with an existing email but wrong password returns User not found', async ({ request }) => {
    // 1. Setup: register a unique fixture account via request.post('/api/createAccount', ...)
    const fixture = generateFixtureAccount();
    const createResponse = await request.post('/api/createAccount', { form: fixture });
    const createBody = await createResponse.json();
    expect(createBody.responseCode).toBe(201);

    try {
      // 2. Send request.post('/api/verifyLogin', { form: { email, password: 'DeliberatelyWrongPassword999!' } })
      const response = await request.post('/api/verifyLogin', {
        form: { email: fixture.email, password: 'DeliberatelyWrongPassword999!' },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.responseCode).toBe(404);
      expect(body.message).toBe('User not found!');
    } finally {
      // 3. Cleanup: request.delete('/api/deleteAccount', { form: { email, password } }) using the ORIGINAL correct password
      const deleteResponse = await request.delete('/api/deleteAccount', {
        form: { email: fixture.email, password: fixture.password },
      });
      const deleteBody = await deleteResponse.json();
      expect(deleteBody.responseCode).toBe(200);
      expect(deleteBody.message).toBe('Account deleted!');
    }
  });
});
