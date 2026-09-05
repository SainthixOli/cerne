const crypto = require('crypto');

process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.NODE_ENV = 'test';
const knex = require('../src/config/connection');
const { closeDb } = require('../src/config/database');

beforeAll(async () => {
    // Reset schema to avoid stale migration states between runs.
    await knex.migrate.rollback(undefined, true);
    await knex.migrate.latest();
});

afterAll(async () => {
    // Close both knex and sqlite singleton used by controllers.
    await closeDb();
    await knex.destroy();
});

beforeEach(async () => {
    // Clean up data between tests if needed, or rely on transaction rollbacks
    // For now, we just clear the profiles table
    await knex('profiles').del();
});
