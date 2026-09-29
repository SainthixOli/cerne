const knex = require('../config/connection');

function inTenant(tenantId, operation) {
    return knex.withTenantTransaction(tenantId, operation);
}

async function findById(id, tenantId) {
    return inTenant(tenantId, (db) => db('profiles').where({ id, tenant_id: tenantId }).first());
}

async function findByIdWithAffiliation(id, tenantId) {
    return inTenant(tenantId, (db) => db('profiles as p')
        .leftJoin('filiacoes as f', function joinAffiliation() {
            this.on('p.id', '=', 'f.user_id').andOn('p.tenant_id', '=', 'f.tenant_id');
        })
        .select('p.*', 'f.status as status_filiacao')
        .where('p.id', id)
        .where('p.tenant_id', tenantId)
        .first());
}

async function updateProfile(id, data, tenantId) {
    return inTenant(tenantId, (db) => db('profiles').where({ id, tenant_id: tenantId }).update(data));
}

async function updatePassword(id, passwordHash, tenantId) {
    return updateProfile(id, { password_hash: passwordHash, change_password_required: false }, tenantId);
}

async function setResetToken(id, token, expires, tenantId) {
    return updateProfile(id, {
        reset_token: token,
        reset_token_expires: expires
    }, tenantId);
}

async function findByResetToken(token, tenantId) {
    return inTenant(tenantId, (db) => db('profiles')
        .where({ reset_token: token, tenant_id: tenantId })
        .where('reset_token_expires', '>', db.fn.now())
        .first());
}

async function clearResetTokenAndSetPassword(id, token, passwordHash, tenantId) {
    return inTenant(tenantId, (db) => db('profiles')
        .where({ id, tenant_id: tenantId, reset_token: token })
        .where('reset_token_expires', '>', db.fn.now())
        .update({
            password_hash: passwordHash,
            reset_token: null,
            reset_token_expires: null,
            change_password_required: false
        }));
}

async function findCandidatesByCpf(cpf, tenantId) {
    return inTenant(tenantId, (db) => db('profiles as p')
        .leftJoin('tenant_super_admins as link', 'link.user_id', 'p.id')
        .select('p.*', 'link.tenant_id as linked_tenant_id')
        .whereRaw("regexp_replace(p.cpf, '[^0-9]', '', 'g') = ?", [cpf])
        .andWhere((query) => query.where('p.tenant_id', tenantId).orWhere('link.tenant_id', tenantId)));
}

module.exports = {
    findById,
    findByIdWithAffiliation,
    updateProfile,
    updatePassword,
    setResetToken,
    findByResetToken,
    clearResetTokenAndSetPassword,
    findCandidatesByCpf
};
