const knex = require('../config/connection');

async function databaseSizeBytes() {
    const row = await knex.raw('SELECT pg_database_size(current_database())::bigint AS bytes');
    return Number(row.rows[0].bytes);
}

async function counts(tenantId) {
    const [users, affiliations, documents] = await Promise.all([
        knex('profiles').where({ tenant_id: tenantId }).count('* as count').first(),
        knex('filiacoes').where({ tenant_id: tenantId }).count('* as count').first(),
        knex('documentos').where({ tenant_id: tenantId }).count('* as count').first()
    ]);
    return {
        users: Number(users.count),
        affiliations: Number(affiliations.count),
        documents: Number(documents.count)
    };
}

async function ping() {
    await knex.raw('SELECT 1');
}

async function recentAffiliations(tenantId) {
    return knex('filiacoes').select('data_solicitacao', 'user_id', 'status')
        .where({ tenant_id: tenantId }).orderBy('data_solicitacao', 'desc').limit(5);
}

module.exports = { databaseSizeBytes, counts, ping, recentAffiliations };
