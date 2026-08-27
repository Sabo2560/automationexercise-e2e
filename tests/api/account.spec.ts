// spec: specs/api.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { generateFixtureAccount } from './testData';

test.describe('Account Management API', () => {
  test('POST /api/createAccount with all required fields creates a new account, confirmed retrievable via getUserDetailByEmail', async ({ request }) => {
    // 1. Generate a unique test user and send request.post('/api/createAccount', ...) with all 17 documented fields populated
    const fixture = generateFixtureAccount();
    const createResponse = await request.post('/api/createAccount', { form: fixture });
    expect(createResponse.status()).toBe(200);

    const createBody = await createResponse.json();
    expect(createBody.responseCode).toBe(201);
    expect(createBody.message).toBe('User created!');

    try {
      // 2. Send request.get('/api/getUserDetailByEmail', { params: { email: <the same fixture email> } })
      const response = await request.get('/api/getUserDetailByEmail', {
        params: { email: fixture.email },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.responseCode).toBe(200);
      expect(body.user.email).toBe(fixture.email);
      expect(body.user.name).toBe(fixture.name);
      expect(body.user.first_name).toBe(fixture.firstname);
      expect(body.user.title).toBe(fixture.title);
    } finally {
      // 3. Cleanup: request.delete('/api/deleteAccount', { form: { email, password } }) using the fixture account's own credentials
      const deleteResponse = await request.delete('/api/deleteAccount', {
        form: { email: fixture.email, password: fixture.password },
      });
      const deleteBody = await deleteResponse.json();
      expect(deleteBody.responseCode).toBe(200);
      expect(deleteBody.message).toBe('Account deleted!');
    }
  });

  test('POST /api/createAccount missing a required field (email) returns a field-specific 400 error', async ({ request }) => {
    // 1. Send request.post('/api/createAccount', { form: {...all documented fields except email...} })
    const fixture = generateFixtureAccount();
    const { email, ...fixtureWithoutEmail } = fixture;
    const response = await request.post('/api/createAccount', { form: fixtureWithoutEmail });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.responseCode).toBe(400);
    expect(body.message).toBe('Bad request, email parameter is missing in POST request.');

    // 2. No cleanup needed: the 400 responseCode itself is sufficient proof no record was created
  });

  test('PUT /api/updateAccount updates an existing account\'s fields, confirmed via a follow-up getUserDetailByEmail', async ({ request }) => {
    // 1. Setup: create a unique fixture account via request.post('/api/createAccount', ...) with an initial field set
    const fixture = generateFixtureAccount();
    fixture.title = 'Mr';
    fixture.firstname = 'Original';
    fixture.city = 'San Francisco';
    fixture.zipcode = '94107';
    fixture.country = 'United States';

    const createResponse = await request.post('/api/createAccount', { form: fixture });
    const createBody = await createResponse.json();
    expect(createBody.responseCode).toBe(201);

    try {
      // 2. Send request.put('/api/updateAccount', { form: { ...same email, same password, and a DIFFERENT value for other fields... } })
      const updatedFields = {
        ...fixture,
        title: 'Mrs',
        firstname: 'Updated',
        city: 'Toronto',
        zipcode: '90001',
        country: 'Canada',
      };
      const updateResponse = await request.put('/api/updateAccount', { form: updatedFields });
      expect(updateResponse.status()).toBe(200);

      const updateBody = await updateResponse.json();
      expect(updateBody.responseCode).toBe(200);
      expect(updateBody.message).toBe('User updated!');

      // 3. Send request.get('/api/getUserDetailByEmail', { params: { email: <the fixture email> } }) to verify the update actually persisted
      const getResponse = await request.get('/api/getUserDetailByEmail', {
        params: { email: fixture.email },
      });
      const getBody = await getResponse.json();
      expect(getBody.user.title).toBe('Mrs');
      expect(getBody.user.first_name).toBe('Updated');
      expect(getBody.user.city).toBe('Toronto');
      expect(getBody.user.country).toBe('Canada');
    } finally {
      // 4. Cleanup: request.delete('/api/deleteAccount', { form: { email, password } })
      const deleteResponse = await request.delete('/api/deleteAccount', {
        form: { email: fixture.email, password: fixture.password },
      });
      const deleteBody = await deleteResponse.json();
      expect(deleteBody.responseCode).toBe(200);
      expect(deleteBody.message).toBe('Account deleted!');
    }
  });

  test('DELETE /api/deleteAccount removes an existing account, confirmed via a follow-up verifyLogin returning User not found', async ({ request }) => {
    // 1. Setup: create a unique fixture account via request.post('/api/createAccount', ...)
    const fixture = generateFixtureAccount();
    const createResponse = await request.post('/api/createAccount', { form: fixture });
    const createBody = await createResponse.json();
    expect(createBody.responseCode).toBe(201);

    // 2. Send request.delete('/api/deleteAccount', { form: { email, password } })
    const deleteResponse = await request.delete('/api/deleteAccount', {
      form: { email: fixture.email, password: fixture.password },
    });
    expect(deleteResponse.status()).toBe(200);

    const deleteBody = await deleteResponse.json();
    expect(deleteBody.responseCode).toBe(200);
    expect(deleteBody.message).toBe('Account deleted!');

    // 3. Send request.post('/api/verifyLogin', { form: { email, password } }) to prove the deletion was real and permanent
    const verifyResponse = await request.post('/api/verifyLogin', {
      form: { email: fixture.email, password: fixture.password },
    });
    const verifyBody = await verifyResponse.json();
    expect(verifyBody.responseCode).toBe(404);
    expect(verifyBody.message).toBe('User not found!');
  });

  test('GET /api/getUserDetailByEmail for a non-existent email returns a 404 responseCode with the documented not-found message', async ({ request }) => {
    // 1. Send request.get('/api/getUserDetailByEmail', { params: { email: 'definitely.does.not.exist.<timestamp>@example.com' } })
    const unregisteredEmail = `definitely.does.not.exist.${Date.now()}@example.com`;
    const response = await request.get('/api/getUserDetailByEmail', {
      params: { email: unregisteredEmail },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.responseCode).toBe(404);
    expect(body.message).toBe('Account not found with this email, try another email!');
  });
});
