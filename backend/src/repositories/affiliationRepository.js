const { getDb } = require('../config/database');

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function getAdminById(adminId, tenantId) {
    const db = await getDb();
    return db.get('SELECT id FROM profiles WHERE id = ? AND tenant_id = ?', [adminId, tenantId]);
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function getAffiliationById(affiliationId, tenantId) {
    const db = await getDb();
    return db.get('SELECT id, user_id FROM filiacoes WHERE id = ? AND tenant_id = ?', [affiliationId, tenantId]);
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function getUserById(userId, tenantId) {
    const db = await getDb();
    return db.get('SELECT * FROM profiles WHERE id = ? AND tenant_id = ?', [userId, tenantId]);
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function activateUserWithPassword(userId, hashedPassword, tenantId) {
    const db = await getDb();
    return db.run(
        "UPDATE profiles SET status_conta = 'ativo', password_hash = ?, change_password_required = 1 WHERE id = ? AND tenant_id = ?",
        [hashedPassword, userId, tenantId]
    );
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function setUserPendingDocs(userId, tenantId) {
    const db = await getDb();
    return db.run("UPDATE profiles SET status_conta = 'pendente_docs' WHERE id = ? AND tenant_id = ?", [userId, tenantId]);
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function markAffiliationApproved(affiliationId, adminId, observacoes, tenantId) {
    const db = await getDb();
    return db.run(
        "UPDATE filiacoes SET status = 'concluido', data_aprovacao = CURRENT_TIMESTAMP, aprovado_por_admin_id = ?, observacoes_admin = ? WHERE id = ? AND tenant_id = ?",
        [adminId, observacoes || 'Aprovado pelo admin', affiliationId, tenantId]
    );
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function markAffiliationRejected(affiliationId, adminId, observacoes, tenantId) {
    const db = await getDb();
    return db.run(
        "UPDATE filiacoes SET status = 'rejeitado', aprovado_por_admin_id = ?, observacoes_admin = ? WHERE id = ? AND tenant_id = ?",
        [adminId, observacoes || 'Rejeitado pelo admin', affiliationId, tenantId]
    );
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function clearAffiliationChat(affiliationId, tenantId) {
    const db = await getDb();
    return db.run('DELETE FROM filiation_chat WHERE filiacao_id = ? AND tenant_id = ?', [affiliationId, tenantId]);
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function addAffiliationChatMessage(affiliationId, senderId, message, tenantId) {
    const db = await getDb();
    return db.run(
        'INSERT INTO filiation_chat (filiacao_id, sender_id, message, tenant_id) VALUES (?, ?, ?, ?)',
        [affiliationId, senderId, message, tenantId]
    );
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function getAffiliationAssignmentById(affiliationId, tenantId) {
    const db = await getDb();
    return db.get(
        'SELECT id, responsavel_admin_id, protocolo, transfer_status FROM filiacoes WHERE id = ? AND tenant_id = ?',
        [affiliationId, tenantId]
    );
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function setAffiliationAssignee(affiliationId, adminId, tenantId) {
    const db = await getDb();
    return db.run(
        "UPDATE filiacoes SET responsavel_admin_id = ?, status_atendimento = 'em_andamento' WHERE id = ? AND tenant_id = ?",
        [adminId, affiliationId, tenantId]
    );
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function setTransferStatusPending(affiliationId, tenantId) {
    const db = await getDb();
    return db.run("UPDATE filiacoes SET transfer_status = 'pending' WHERE id = ? AND tenant_id = ?", [affiliationId, tenantId]);
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function clearTransferStatus(affiliationId, tenantId) {
    const db = await getDb();
    return db.run('UPDATE filiacoes SET transfer_status = NULL WHERE id = ? AND tenant_id = ?', [affiliationId, tenantId]);
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function getAdminProfileById(adminId, tenantId) {
    const db = await getDb();
    return db.get('SELECT id, nome_completo, email FROM profiles WHERE id = ? AND tenant_id = ?', [adminId, tenantId]);
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function transferAffiliationToAdmin(affiliationId, targetAdminId, tenantId) {
    const db = await getDb();
    return db.run(
        "UPDATE filiacoes SET responsavel_admin_id = ?, status_atendimento = 'em_andamento', transfer_status = NULL WHERE id = ? AND tenant_id = ?",
        [targetAdminId, affiliationId, tenantId]
    );
}

async function findUserByCpfNormalized(cleanCpf) {
    const db = await getDb();
    return db.get(
        `SELECT id, nome_completo, status_conta
         FROM profiles
         WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?`,
        [cleanCpf]
    );
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function getLatestAffiliationByUserId(userId, tenantId) {
    const db = await getDb();
    return db.get(
        `SELECT
            f.id, f.status, f.observacoes_admin, f.data_aprovacao, f.protocolo, f.status_atendimento,
            p_admin.nome_completo as responsavel_nome
         FROM filiacoes f
         LEFT JOIN profiles p_admin ON f.responsavel_admin_id = p_admin.id
         WHERE f.user_id = ? AND f.tenant_id = ?
         ORDER BY f.data_solicitacao DESC
         LIMIT 1`,
        [userId, tenantId]
    );
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function countChatMessagesByAffiliationId(affiliationId, tenantId) {
    const db = await getDb();
    return db.get('SELECT COUNT(*) as count FROM filiation_chat WHERE filiacao_id = ? AND tenant_id = ?', [affiliationId, tenantId]);
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function getAffiliationHistoryByUserId(userId, tenantId) {
    const db = await getDb();
    return db.all(
        `SELECT f.*, d.url_arquivo
         FROM filiacoes f
         LEFT JOIN documentos d ON f.id = d.filiacao_id AND d.tipo_documento = 'ficha_assinada'
         WHERE f.user_id = ? AND f.tenant_id = ?
         ORDER BY f.data_solicitacao DESC`,
        [userId, tenantId]
    );
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function getAffiliationWithOwnerAndStatus(affiliationId, tenantId) {
    const db = await getDb();
    return db.get(
        `SELECT f.user_id, p.cpf, f.status
         FROM filiacoes f
         JOIN profiles p ON f.user_id = p.id
         WHERE f.id = ? AND f.tenant_id = ?`,
        [affiliationId, tenantId]
    );
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function getChatMessagesByAffiliationId(affiliationId, tenantId) {
    const db = await getDb();
    return db.all(
        `SELECT c.*, p.nome_completo as sender_name, p.role as sender_role
         FROM filiation_chat c
         JOIN profiles p ON c.sender_id = p.id
         WHERE c.filiacao_id = ? AND c.tenant_id = ?
         ORDER BY c.created_at ASC`,
        [affiliationId, tenantId]
    );
}

// 🏢 TENANT-AWARE: Requires tenantId for data isolation
async function deleteOldRejectedChatMessages(affiliationId, tenantId) {
    const db = await getDb();
    return db.run(
        "DELETE FROM filiation_chat WHERE filiacao_id = ? AND tenant_id = ? AND created_at < date('now', '-7 days')",
        [affiliationId, tenantId]
    );
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
    deleteOldRejectedChatMessages
};
