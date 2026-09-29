const knex = require('../config/connection');

async function create(notification, transaction) {
    return (transaction || knex)('notifications').insert(notification);
}

async function listApprovedForGroup(group, tenantId) {
    return knex('notifications').where({ status: 'approved', tenant_id: tenantId })
        .whereIn('target_group', ['all', group]).orderBy('created_at', 'desc');
}

async function listPending(tenantId) {
    return knex('notifications as notification')
        .join('profiles as author', function joinAuthor() {
            this.on('notification.created_by', '=', 'author.id')
                .andOn('notification.tenant_id', '=', 'author.tenant_id');
        })
        .select('notification.*', 'author.nome_completo as author_name')
        .where({ 'notification.status': 'pending', 'notification.tenant_id': tenantId })
        .orderBy('notification.created_at', 'asc');
}

async function approve(id, approverId, tenantId, transaction) {
    return (transaction || knex)('notifications').where({ id, tenant_id: tenantId })
        .update({ status: 'approved', approved_by: approverId });
}

async function remove(id, tenantId) {
    return knex('notifications').where({ id, tenant_id: tenantId }).delete();
}

module.exports = { create, listApprovedForGroup, listPending, approve, remove };
