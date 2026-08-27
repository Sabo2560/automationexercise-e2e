/**
 * Shared test-data generator for the API Test Track (`tests/api/**`).
 *
 * Generates a unique, fully-populated fixture account payload for `POST /api/createAccount`,
 * mirroring `tests/pages/SignupPage.ts`'s `generateTestUser()` convention (timestamp + random
 * suffix, synthetic data only — never real personal information). Hoisted here once the same
 * definition turned up identically in both `login.spec.ts` and `account.spec.ts`, per this
 * project's convention that a pattern repeated across two or more spec files belongs in a shared
 * helper rather than being duplicated locally.
 */
export function generateFixtureAccount() {
  const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    name: `Test User ${uniqueSuffix}`,
    email: `apitest_${uniqueSuffix}@example.com`,
    password: 'TestPass123!',
    title: 'Mr',
    birth_date: '10',
    birth_month: 'May',
    birth_year: '1990',
    firstname: 'Test',
    lastname: 'User',
    company: 'Acme Inc',
    address1: '123 Test Street',
    address2: '',
    country: 'United States',
    zipcode: '10001',
    state: 'New York',
    city: 'New York',
    mobile_number: '1234567890',
  };
}
