const knex = require('../config/connection');

async function list(tenantId) {
    return knex('system_settings').where({ tenant_id: tenantId });
}

async function find(key, tenantId) {
    return knex('system_settings').where({ key, tenant_id: tenantId }).first();
}

async function upsert(key, value, tenantId) {
    return knex('system_settings').insert({
        tenant_id: tenantId,
        key,
        value,
        updated_at: knex.fn.now()
    }).onConflict(['tenant_id', 'key']).merge({ value, updated_at: knex.fn.now() });
}

module.exports = { list, find, upsert };
