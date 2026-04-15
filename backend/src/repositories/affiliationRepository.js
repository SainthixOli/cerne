const { getDb } = require('../config/database');

async function getAdminById(adminId) {
    const db = await getDb();
    return db.get('SELECT id FROM profiles WHERE id = ?', [adminId]);
}

async function getAffiliationById(affiliationId) {
    const db = await getDb();
    return db.get('SELECT id, user_id FROM filiacoes WHERE id = ?', [affiliationId]);
}

async function getUserById(userId) {
    const db = await getDb();
    return db.get('SELECT * FROM profiles WHERE id = ?', [userId]);
}

async function activateUserWithPassword(userId, hashedPassword) {
    const db = await getDb();
    return db.run(
        "UPDATE profiles SET status_conta = 'ativo', password_hash = ?, change_password_required = 1 WHERE id = ?",
        [hashedPassword, userId]
    );
}

async function setUserPendingDocs(userId) {
    const db = await getDb();
    return db.run("UPDATE profiles SET status_conta = 'pendente_docs' WHERE id = ?", [userId]);
}

async function markAffiliationApproved(affiliationId, adminId, observacoes) {
    const db = await getDb();
    return db.run(
        "UPDATE filiacoes SET status = 'concluido', data_aprovacao = CURRENT_TIMESTAMP, aprovado_por_admin_id = ?, observacoes_admin = ? WHERE id = ?",
        [adminId, observacoes || 'Aprovado pelo admin', affiliationId]
    );
}

async function markAffiliationRejected(affiliationId, adminId, observacoes) {
    const db = await getDb();
    return db.run(
        "UPDATE filiacoes SET status = 'rejeitado', aprovado_por_admin_id = ?, observacoes_admin = ? WHERE id = ?",
        [adminId, observacoes || 'Rejeitado pelo admin', affiliationId]
    );
}

async function clearAffiliationChat(affiliationId) {
    const db = await getDb();
    return db.run('DELETE FROM filiation_chat WHERE filiacao_id = ?', [affiliationId]);
}

async function addAffiliationChatMessage(affiliationId, senderId, message) {
    const db = await getDb();
    return db.run(
        'INSERT INTO filiation_chat (filiacao_id, sender_id, message) VALUES (?, ?, ?)',
        [affiliationId, senderId, message]
    );
}

async function getAffiliationAssignmentById(affiliationId) {
    const db = await getDb();
    return db.get(
        'SELECT id, responsavel_admin_id, protocolo, transfer_status FROM filiacoes WHERE id = ?',
        [affiliationId]
    );
}

async function setAffiliationAssignee(affiliationId, adminId) {
    const db = await getDb();
    return db.run(
        "UPDATE filiacoes SET responsavel_admin_id = ?, status_atendimento = 'em_andamento' WHERE id = ?",
        [adminId, affiliationId]
    );
}

async function setTransferStatusPending(affiliationId) {
    const db = await getDb();
    return db.run("UPDATE filiacoes SET transfer_status = 'pending' WHERE id = ?", [affiliationId]);
}

async function clearTransferStatus(affiliationId) {
    const db = await getDb();
    return db.run('UPDATE filiacoes SET transfer_status = NULL WHERE id = ?', [affiliationId]);
}

async function getAdminProfileById(adminId) {
    const db = await getDb();
    return db.get('SELECT id, nome_completo, email FROM profiles WHERE id = ?', [adminId]);
}

async function transferAffiliationToAdmin(affiliationId, targetAdminId) {
    const db = await getDb();
    return db.run(
        "UPDATE filiacoes SET responsavel_admin_id = ?, status_atendimento = 'em_andamento', transfer_status = NULL WHERE id = ?",
        [targetAdminId, affiliationId]
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

async function getLatestAffiliationByUserId(userId) {
    const db = await getDb();
    return db.get(
        `SELECT
            f.id, f.status, f.observacoes_admin, f.data_aprovacao, f.protocolo, f.status_atendimento,
            p_admin.nome_completo as responsavel_nome
         FROM filiacoes f
         LEFT JOIN profiles p_admin ON f.responsavel_admin_id = p_admin.id
         WHERE f.user_id = ?
         ORDER BY f.data_solicitacao DESC
         LIMIT 1`,
        [userId]
    );
}

async function countChatMessagesByAffiliationId(affiliationId) {
    const db = await getDb();
    return db.get('SELECT COUNT(*) as count FROM filiation_chat WHERE filiacao_id = ?', [affiliationId]);
}

async function getAffiliationHistoryByUserId(userId) {
    const db = await getDb();
    return db.all(
        `SELECT f.*, d.url_arquivo
         FROM filiacoes f
         LEFT JOIN documentos d ON f.id = d.filiacao_id AND d.tipo_documento = 'ficha_assinada'
         WHERE f.user_id = ?
         ORDER BY f.data_solicitacao DESC`,
        [userId]
    );
}

async function getAffiliationWithOwnerAndStatus(affiliationId) {
    const db = await getDb();
    return db.get(
        `SELECT f.user_id, p.cpf, f.status
         FROM filiacoes f
         JOIN profiles p ON f.user_id = p.id
         WHERE f.id = ?`,
        [affiliationId]
    );
}

async function getChatMessagesByAffiliationId(affiliationId) {
    const db = await getDb();
    return db.all(
        `SELECT c.*, p.nome_completo as sender_name, p.role as sender_role
         FROM filiation_chat c
         JOIN profiles p ON c.sender_id = p.id
         WHERE c.filiacao_id = ?
         ORDER BY c.created_at ASC`,
        [affiliationId]
    );
}

async function deleteOldRejectedChatMessages(affiliationId) {
    const db = await getDb();
    return db.run(
        "DELETE FROM filiation_chat WHERE filiacao_id = ? AND created_at < date('now', '-7 days')",
        [affiliationId]
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
