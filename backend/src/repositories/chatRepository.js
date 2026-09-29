const knex = require('../config/connection');

async function findParticipants(ids, tenantId) {
    return knex('profiles as profile')
        .leftJoin('tenant_super_admins as link', function joinLink() {
            this.on('link.user_id', '=', 'profile.id').andOnVal('link.tenant_id', '=', tenantId);
        })
        .distinct('profile.id', 'profile.role')
        .whereIn('profile.id', ids)
        .where('profile.status_conta', 'ativo')
        .andWhere((query) => query.where('profile.tenant_id', tenantId)
            .orWhere((linked) => linked.where('profile.role', 'super_admin').where('link.tenant_id', tenantId)));
}

async function findConversation(adminId, userId, tenantId, transaction) {
    return (transaction || knex)('conversations')
        .where({ admin_id: adminId, user_id: userId, tenant_id: tenantId }).first();
}

async function createConversation(id, adminId, userId, tenantId, transaction) {
    await (transaction || knex)('conversations').insert({
        id, admin_id: adminId, user_id: userId, tenant_id: tenantId
    });
    return { id, admin_id: adminId, user_id: userId, tenant_id: tenantId };
}

function lastMessageSelection() {
    return knex.raw(`(
        SELECT message.content FROM messages message
        WHERE message.conversation_id = conversation.id
          AND message.tenant_id = conversation.tenant_id
        ORDER BY message.created_at DESC LIMIT 1
    ) AS last_message`);
}

async function listConversations(userId, role, tenantId, mode) {
    const query = knex('conversations as conversation');
    if (role === 'super_admin' && mode === 'all') {
        return query.join('profiles as peer', function joinMember() {
            this.on('peer.id', '=', 'conversation.user_id')
                .andOn('peer.tenant_id', '=', 'conversation.tenant_id');
        }).leftJoin('profiles as admin_profile', function joinAdmin() {
            this.on('admin_profile.id', '=', 'conversation.admin_id');
        }).select('conversation.*', 'peer.nome_completo as peer_name', 'peer.role as peer_role',
            'admin_profile.nome_completo as admin_name', lastMessageSelection())
            .where('conversation.tenant_id', tenantId).orderBy('conversation.last_updated', 'desc');
    }

    if (role === 'admin' || role === 'super_admin') {
        return query.join('profiles as peer', function joinMember() {
            this.on('peer.id', '=', 'conversation.user_id')
                .andOn('peer.tenant_id', '=', 'conversation.tenant_id');
        }).select('conversation.*', 'peer.nome_completo as peer_name', 'peer.role as peer_role',
            lastMessageSelection())
            .where({ 'conversation.admin_id': userId, 'conversation.tenant_id': tenantId })
            .orderBy('conversation.last_updated', 'desc');
    }

    return query.join('profiles as peer', 'peer.id', 'conversation.admin_id')
        .leftJoin('tenant_super_admins as link', function joinLink() {
            this.on('link.user_id', '=', 'peer.id')
                .andOn('link.tenant_id', '=', 'conversation.tenant_id');
        })
        .distinct('conversation.*', 'peer.nome_completo as peer_name', 'peer.role as peer_role',
            lastMessageSelection())
        .where({ 'conversation.user_id': userId, 'conversation.tenant_id': tenantId })
        .andWhere((scope) => scope.whereColumn('peer.tenant_id', 'conversation.tenant_id')
            .orWhere((linked) => linked.where('peer.role', 'super_admin').whereNotNull('link.tenant_id')))
        .orderBy('conversation.last_updated', 'desc');
}

async function findConversationForAccess(id, tenantId) {
    return knex('conversations as conversation')
        .join('profiles as admin_profile', 'admin_profile.id', 'conversation.admin_id')
        .join('profiles as member_profile', function joinMember() {
            this.on('member_profile.id', '=', 'conversation.user_id')
                .andOn('member_profile.tenant_id', '=', 'conversation.tenant_id');
        })
        .leftJoin('tenant_super_admins as link', function joinLink() {
            this.on('link.user_id', '=', 'admin_profile.id')
                .andOn('link.tenant_id', '=', 'conversation.tenant_id');
        })
        .select('conversation.id', 'conversation.admin_id', 'conversation.user_id')
        .where({ 'conversation.id': id, 'conversation.tenant_id': tenantId })
        .andWhere((scope) => scope.whereColumn('admin_profile.tenant_id', 'conversation.tenant_id')
            .orWhere((linked) => linked.where('admin_profile.role', 'super_admin').whereNotNull('link.tenant_id')))
        .first();
}

async function listMessages(conversationId, tenantId) {
    return knex('messages as message')
        .join('profiles as sender', function joinSender() {
            this.on('sender.id', '=', 'message.sender_id')
                .andOn('sender.tenant_id', '=', 'message.tenant_id');
        })
        .select('message.*', 'sender.nome_completo as sender_name')
        .where({ 'message.conversation_id': conversationId, 'message.tenant_id': tenantId })
        .orderBy('message.created_at', 'asc');
}

async function createMessage({ id, conversationId, senderId, content, tenantId }) {
    return knex.transaction(async (trx) => {
        await trx('messages').insert({
            id, conversation_id: conversationId, sender_id: senderId, content, tenant_id: tenantId
        });
        const updated = await trx('conversations').where({ id: conversationId, tenant_id: tenantId })
            .update({ last_updated: trx.fn.now() });
        if (updated !== 1) throw new Error('Conversation disappeared while sending message');
    });
}

async function listAvailableAdmins(tenantId) {
    return knex('profiles as profile')
        .leftJoin('tenant_super_admins as link', function joinLink() {
            this.on('link.user_id', '=', 'profile.id').andOnVal('link.tenant_id', '=', tenantId);
        })
        .distinct('profile.id', 'profile.nome_completo', 'profile.role')
        .whereIn('profile.role', ['admin', 'super_admin'])
        .where('profile.status_conta', 'ativo')
        .andWhere((scope) => scope.where('profile.tenant_id', tenantId)
            .orWhere((linked) => linked.where('profile.role', 'super_admin').whereNotNull('link.tenant_id')));
}

module.exports = {
    findParticipants,
    findConversation,
    createConversation,
    listConversations,
    findConversationForAccess,
    listMessages,
    createMessage,
    listAvailableAdmins
};
