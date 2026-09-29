const knex = require('../config/connection');

const RESOURCE_TABLES = new Set([
    'profiles', 'filiacoes', 'documentos', 'conversations', 'messages',
    'filiation_chat', 'notifications', 'admin_evaluations', 'system_settings',
    'audit_logs', 'security_alerts', 'affiliation_upload_tokens'
]);

async function findBySlug(slug) {
    return knex('tenants').where({ slug }).first();
}

async function findById(id) {
    return knex('tenants').where({ id }).first();
}

async function findProfileById(id, tenantId) {
    return knex.withTenantTransaction(tenantId, (db) => db('profiles')
        .where({ id })
        .andWhere((query) => query
            .where('tenant_id', tenantId)
            .orWhereExists(db('tenant_super_admins as link')
                .select(db.raw('1'))
                .whereRaw('link.user_id = profiles.id')
                .andWhere('link.tenant_id', tenantId)))
        .first());
}

async function hasSuperAdminLink(userId, tenantId) {
    return knex.withTenantTransaction(tenantId, async (db) => Boolean(await db('tenant_super_admins')
        .where({ user_id: userId, tenant_id: tenantId })
        .first('id')));
}

function assertResourceTable(tableName) {
    if (!RESOURCE_TABLES.has(tableName)) throw new TypeError('Tabela de recurso não permitida');
}

async function findResourceTenant(tableName, id) {
    assertResourceTable(tableName);
    return knex(tableName).select('tenant_id').where({ id }).first();
}

async function countResourcesInTenant(tableName, ids, tenantId) {
    assertResourceTable(tableName);
    const row = await knex(tableName).whereIn('id', ids).andWhere({ tenant_id: tenantId }).count('* as total').first();
    return Number(row.total);
}

module.exports = {
    findBySlug,
    findById,
    findProfileById,
    hasSuperAdminLink,
    findResourceTenant,
    countResourcesInTenant
};
