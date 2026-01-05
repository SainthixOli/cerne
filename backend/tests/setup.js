process.env.JWT_SECRET = 'test_secret_key_123';
process.env.NODE_ENV = 'test';
const knex = require('../src/config/connection');

beforeAll(async () => {
    // Run migrations on the test database
    await knex.migrate.latest();
});

afterAll(async () => {
    // Close connection
    await knex.destroy();
});

beforeEach(async () => {
    // Clean up data between tests if needed, or rely on transaction rollbacks
    // For now, we just clear the profiles table
    await knex('profiles').del();
});
