const knex = require('../config/connection');

class User {
    // Tenant-agnostic: used during login to find user by CPF before tenant context
    static async findByCpf(cpf) {
        return knex('profiles').where({ cpf }).first();
    }

    // Tenant-aware: requires tenantId for data isolation
    static async findById(id, tenantId) {
        return knex('profiles')
            .where({ id, tenant_id: tenantId })
            .first();
    }

    // Tenant-aware: requires tenantId for data isolation
    static async findByIdWithFiliation(id, tenantId) {
        return knex('profiles as p')
            .leftJoin('filiacoes as f', 'p.id', 'f.user_id')
            .select('p.*', 'f.status as status_filiacao')
            .where('p.id', id)
            .where('p.tenant_id', tenantId)
            .first();
    }

    // Tenant-aware: requires tenantId for data isolation
    static async update(id, data, tenantId) {
        return knex('profiles')
            .where({ id, tenant_id: tenantId })
            .update(data);
    }

    // Tenant-aware: requires tenantId for data isolation
    static async updatePassword(id, hashedPassword, tenantId) {
        return knex('profiles')
            .where({ id, tenant_id: tenantId })
            .update({
                password_hash: hashedPassword,
                change_password_required: 0
            });
    }

    // Tenant-aware: requires tenantId for data isolation
    static async setResetToken(id, token, expires, tenantId) {
        return knex('profiles')
            .where({ id, tenant_id: tenantId })
            .update({
                reset_token: token,
                reset_token_expires: expires.toISOString()
            });
    }

    // Tenant-aware: requires tenantId for data isolation
    static async clearResetTokenAndSetPassword(id, hashedPassword, tenantId) {
        return knex('profiles')
            .where({ id, tenant_id: tenantId })
            .update({
                password_hash: hashedPassword,
                reset_token: null,
                reset_token_expires: null,
                change_password_required: 0
            });
    }

    // Tenant-agnostic: used to find user by reset token (password reset flow)
    static async findByResetToken(token) {
        return knex('profiles')
            .where({ reset_token: token })
            .where('reset_token_expires', '>', new Date().toISOString())
            .first();
    }
}

module.exports = User;
