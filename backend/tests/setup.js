const crypto = require('crypto');

process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.OUTBOX_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
process.env.OBJECT_STORAGE_DRIVER = 'memory';
process.env.LEGACY_BEARER_TOKEN_RESPONSE = 'true';
process.env.NODE_ENV = 'test';
const knex = require('../src/config/connection');

beforeAll(async () => {
    // The suite always targets an explicitly disposable PostgreSQL database.
    // Schema lifecycle is validated separately by db:cycle; suites only ensure latest.
    await knex.migrate.latest();
});

afterAll(async () => {
    await knex.destroy();
});

beforeEach(async () => {
    // Respect the same dependency order enforced in production. Deleting only profiles
    // masked orphan creation before Phase 2 foreign keys were enabled.
    for (const table of [
        'delivery_outbox',
        'messages',
        'affiliation_upload_tokens',
        'filiation_chat',
        'documentos',
        'conversations',
        'notifications',
        'admin_evaluations',
        'audit_logs',
        'security_alerts',
        'filiacoes',
        'tenant_super_admins',
        'system_settings',
        'profiles'
    ]) await knex(table).del();
});
