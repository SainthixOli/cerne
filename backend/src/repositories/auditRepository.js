const knex = require('../config/connection');

async function create(entry, transaction) {
    return (transaction || knex)('audit_logs').insert(entry);
}

function logsWithActor(tenantId) {
    return knex('audit_logs as audit')
        .leftJoin('profiles as actor', function joinActor() {
            this.on('audit.admin_id', '=', 'actor.id').andOn('audit.tenant_id', '=', 'actor.tenant_id');
        })
        .select('audit.*', 'actor.nome_completo as admin_name')
        .where('audit.tenant_id', tenantId);
}

async function list(tenantId) {
    return logsWithActor(tenantId).orderBy('audit.created_at', 'desc');
}

async function listForAdmin(adminId, tenantId) {
    return logsWithActor(tenantId)
        .andWhere((query) => query.where('audit.admin_id', adminId)
            .orWhere('audit.details', 'like', `%"to":"${adminId}"%`))
        .orderBy('audit.created_at', 'desc');
}

module.exports = { create, list, listForAdmin };
