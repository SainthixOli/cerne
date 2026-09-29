const knex = require('../config/connection');

async function findForAccess(id, tenantId) {
    return knex('documentos as d')
        .join('profiles as owner', function joinOwner() {
            this.on('owner.id', '=', 'd.user_id').andOn((tenantJoin) => tenantJoin
                .on('owner.tenant_id', '=', 'd.tenant_id')
                .orOn((superAdminJoin) => superAdminJoin
                    .onVal('owner.role', '=', 'super_admin')
                    .onExists(knex('tenant_super_admins as link').select(knex.raw('1'))
                        .whereRaw('link.user_id = owner.id')
                        .whereRaw('link.tenant_id = d.tenant_id'))));
        })
        .leftJoin('filiacoes as f', function joinAffiliation() {
            this.on('f.id', '=', 'd.filiacao_id')
                .andOn('f.tenant_id', '=', 'd.tenant_id')
                .andOn('f.user_id', '=', 'd.user_id');
        })
        .select('d.id', 'd.user_id', 'd.url_arquivo', 'f.id as authorized_affiliation_id',
            'f.responsavel_admin_id')
        .where({ 'd.id': id, 'd.tenant_id': tenantId })
        .first();
}

async function listForUser(userId, tenantId) {
    return knex('documentos').select('id', 'tipo_documento', 'data_upload')
        .where({ user_id: userId, tenant_id: tenantId })
        .orderBy('data_upload', 'desc');
}

async function latestAffiliationForUser(userId, tenantId) {
    return knex('filiacoes').select('id').where({ user_id: userId, tenant_id: tenantId })
        .orderBy('data_solicitacao', 'desc').orderBy('id', 'desc').first();
}

async function create({ userId, affiliationId = null, storageKey, type, tenantId }, transaction) {
    const db = transaction || knex;
    const [document] = await db('documentos').insert({
        user_id: userId,
        filiacao_id: affiliationId,
        url_arquivo: storageKey,
        tipo_documento: type,
        tenant_id: tenantId
    }).returning('id');
    return document.id;
}

module.exports = { findForAccess, listForUser, latestAffiliationForUser, create };
