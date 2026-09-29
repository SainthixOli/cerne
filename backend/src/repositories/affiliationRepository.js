const knex = require('../config/connection');

const executor = (transaction) => transaction || knex;

async function getAdminById(adminId, tenantId, transaction) {
    return executor(transaction)('profiles').select('id').where({ id: adminId, tenant_id: tenantId }).first();
}

async function getAffiliationById(affiliationId, tenantId, transaction) {
    return executor(transaction)('filiacoes').select('id', 'user_id')
        .where({ id: affiliationId, tenant_id: tenantId }).first();
}

async function getUserById(userId, tenantId, transaction) {
    return executor(transaction)('profiles').where({ id: userId, tenant_id: tenantId }).first();
}

async function activateUserWithPassword(userId, hashedPassword, tenantId, transaction) {
    return executor(transaction)('profiles').where({ id: userId, tenant_id: tenantId }).update({
        status_conta: 'ativo', password_hash: hashedPassword, change_password_required: true
    });
}

async function setUserPendingDocs(userId, tenantId, transaction) {
    return executor(transaction)('profiles').where({ id: userId, tenant_id: tenantId })
        .update({ status_conta: 'pendente_docs' });
}

async function markAffiliationApproved(affiliationId, adminId, observacoes, tenantId, transaction) {
    const db = executor(transaction);
    return db('filiacoes').where({ id: affiliationId, tenant_id: tenantId }).update({
        status: 'concluido',
        data_aprovacao: db.fn.now(),
        aprovado_por_admin_id: adminId,
        observacoes_admin: observacoes || 'Aprovado pelo admin'
    });
}

async function markAffiliationRejected(affiliationId, adminId, observacoes, tenantId, transaction) {
    return executor(transaction)('filiacoes').where({ id: affiliationId, tenant_id: tenantId }).update({
        status: 'rejeitado',
        aprovado_por_admin_id: adminId,
        observacoes_admin: observacoes || 'Rejeitado pelo admin'
    });
}

async function clearAffiliationChat(affiliationId, tenantId, transaction) {
    return executor(transaction)('filiation_chat').where({ filiacao_id: affiliationId, tenant_id: tenantId }).delete();
}

async function addAffiliationChatMessage(affiliationId, senderId, message, tenantId, transaction) {
    return executor(transaction)('filiation_chat').insert({
        filiacao_id: affiliationId, sender_id: senderId, message, tenant_id: tenantId
    });
}

async function getAffiliationAssignmentById(affiliationId, tenantId, transaction) {
    return executor(transaction)('filiacoes')
        .select('id', 'responsavel_admin_id', 'protocolo', 'transfer_status')
        .where({ id: affiliationId, tenant_id: tenantId }).first();
}

async function setAffiliationAssignee(affiliationId, adminId, tenantId, transaction) {
    return executor(transaction)('filiacoes').where({ id: affiliationId, tenant_id: tenantId })
        .update({ responsavel_admin_id: adminId, status_atendimento: 'em_andamento' });
}

async function setTransferStatusPending(affiliationId, tenantId, transaction) {
    return executor(transaction)('filiacoes').where({ id: affiliationId, tenant_id: tenantId })
        .update({ transfer_status: 'pending' });
}

async function clearTransferStatus(affiliationId, tenantId, transaction) {
    return executor(transaction)('filiacoes').where({ id: affiliationId, tenant_id: tenantId })
        .update({ transfer_status: null });
}

async function getAdminProfileById(adminId, tenantId, transaction) {
    return executor(transaction)('profiles').select('id', 'nome_completo', 'email')
        .where({ id: adminId, tenant_id: tenantId }).whereIn('role', ['admin', 'super_admin']).first();
}

async function transferAffiliationToAdmin(affiliationId, targetAdminId, tenantId, transaction) {
    return executor(transaction)('filiacoes').where({ id: affiliationId, tenant_id: tenantId }).update({
        responsavel_admin_id: targetAdminId, status_atendimento: 'em_andamento', transfer_status: null
    });
}

async function findUserByCpfNormalized(cleanCpf, tenantId) {
    const matches = await knex('profiles')
        .select('id', 'nome_completo', 'status_conta')
        .whereRaw("REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?", [cleanCpf])
        .andWhere('tenant_id', tenantId);
    if (matches.length > 1) throw new Error('Ambiguous CPF within tenant');
    return matches[0] || null;
}

async function getLatestAffiliationByUserId(userId, tenantId) {
    return knex('filiacoes as f')
        .leftJoin('profiles as p_admin', function joinAdmin() {
            this.on('f.responsavel_admin_id', '=', 'p_admin.id').andOn('p_admin.tenant_id', '=', 'f.tenant_id');
        })
        .select('f.id', 'f.status', 'f.observacoes_admin', 'f.data_aprovacao', 'f.protocolo',
            'f.status_atendimento', 'p_admin.nome_completo as responsavel_nome')
        .where({ 'f.user_id': userId, 'f.tenant_id': tenantId })
        .orderBy('f.data_solicitacao', 'desc').first();
}

async function countChatMessagesByAffiliationId(affiliationId, tenantId) {
    const row = await knex('filiation_chat').where({ filiacao_id: affiliationId, tenant_id: tenantId })
        .count({ count: '*' }).first();
    return { count: Number(row.count) };
}

async function getAffiliationHistoryByUserId(userId, tenantId) {
    return knex('filiacoes as f')
        .leftJoin('documentos as d', function joinDocument() {
            this.on('f.id', '=', 'd.filiacao_id').andOn('d.tenant_id', '=', 'f.tenant_id')
                .andOnVal('d.tipo_documento', '=', 'ficha_assinada');
        })
        .select('f.*', 'd.id as document_id')
        .where({ 'f.user_id': userId, 'f.tenant_id': tenantId })
        .orderBy('f.data_solicitacao', 'desc');
}

async function getAffiliationWithOwnerAndStatus(affiliationId, tenantId) {
    return knex('filiacoes as f').join('profiles as p', function joinProfile() {
        this.on('f.user_id', '=', 'p.id').andOn('p.tenant_id', '=', 'f.tenant_id');
    }).select('f.user_id', 'f.responsavel_admin_id', 'f.status')
        .where({ 'f.id': affiliationId, 'f.tenant_id': tenantId }).first();
}

async function getChatMessagesByAffiliationId(affiliationId, tenantId) {
    return knex('filiation_chat as c').join('profiles as p', function joinProfile() {
        this.on('c.sender_id', '=', 'p.id').andOn('p.tenant_id', '=', 'c.tenant_id');
    }).select('c.*', 'p.nome_completo as sender_name', 'p.role as sender_role')
        .where({ 'c.filiacao_id': affiliationId, 'c.tenant_id': tenantId }).orderBy('c.created_at', 'asc');
}

async function deleteOldRejectedChatMessages(affiliationId, tenantId) {
    return knex('filiation_chat').where({ filiacao_id: affiliationId, tenant_id: tenantId })
        .where('created_at', '<', knex.raw("CURRENT_TIMESTAMP - INTERVAL '7 days'")).delete();
}

async function listLatestByTenant(tenantId) {
    const latest = knex('filiacoes')
        .distinctOn('user_id')
        .select('*')
        .where({ tenant_id: tenantId })
        .orderBy('user_id')
        .orderBy('data_solicitacao', 'desc')
        .orderBy('id', 'desc');

    return knex.from(latest.as('f'))
        .join('profiles as p', function joinProfile() {
            this.on('f.user_id', '=', 'p.id').andOn('f.tenant_id', '=', 'p.tenant_id');
        })
        .select(
            'p.id as user_id', 'p.nome_completo as nome', 'p.cpf', 'p.status_conta',
            'f.id', 'f.status', 'f.data_solicitacao', 'f.observacoes_admin', 'f.protocolo',
            'f.responsavel_admin_id', 'f.status_atendimento', 'f.transfer_status',
            knex.raw(`(
                SELECT d.id FROM documentos d
                WHERE d.filiacao_id = f.id AND d.tenant_id = f.tenant_id
                  AND d.tipo_documento = 'ficha_assinada'
                ORDER BY d.id DESC LIMIT 1
            ) AS document_id`),
            knex.raw(`(
                SELECT COUNT(*)::integer FROM filiacoes history
                WHERE history.user_id = p.id AND history.tenant_id = f.tenant_id
            ) AS total_requests`)
        )
        .orderBy('f.data_solicitacao', 'desc');
}

async function updateAffiliationStatus(affiliationId, tenantId, status, serviceStatus) {
    return knex('filiacoes').where({ id: affiliationId, tenant_id: tenantId })
        .update({ status, status_atendimento: serviceStatus });
}

module.exports = {
    getAdminById,
    getAffiliationById,
    getUserById,
    activateUserWithPassword,
    setUserPendingDocs,
    markAffiliationApproved,
    markAffiliationRejected,
    clearAffiliationChat,
    addAffiliationChatMessage,
    getAffiliationAssignmentById,
    setAffiliationAssignee,
    setTransferStatusPending,
    clearTransferStatus,
    getAdminProfileById,
    transferAffiliationToAdmin,
    findUserByCpfNormalized,
    getLatestAffiliationByUserId,
    countChatMessagesByAffiliationId,
    getAffiliationHistoryByUserId,
    getAffiliationWithOwnerAndStatus,
    getChatMessagesByAffiliationId,
    deleteOldRejectedChatMessages,
    listLatestByTenant,
    updateAffiliationStatus
};
