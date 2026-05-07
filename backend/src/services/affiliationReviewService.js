const bcrypt = require('bcrypt');
const emailService = require('./emailService');
const auditService = require('./auditService');
const affiliationRepository = require('../repositories/affiliationRepository');

class ServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// 🏢 Tenant-aware: Requires tenantId for data isolation
async function approveAffiliation({ affiliationId, adminId, observacoes, tenantId }) {
    const adminExists = await affiliationRepository.getAdminById(adminId, tenantId);  // ✅ NOVO: passar tenantId
    if (!adminExists) {
        throw new ServiceError('Sessão inválida ou expirada. Por favor, faça login novamente.', 401);
    }

    const filiacao = await affiliationRepository.getAffiliationById(affiliationId, tenantId);  // ✅ NOVO: passar tenantId
    if (!filiacao) {
        throw new ServiceError('Affiliation not found', 404);
    }

    const user = await affiliationRepository.getUserById(filiacao.user_id, tenantId);  // ✅ NOVO: passar tenantId
    if (!user) {
        throw new ServiceError('User associated with this affiliation not found.', 404);
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await affiliationRepository.activateUserWithPassword(filiacao.user_id, hashedPassword, tenantId);  // ✅ NOVO: passar tenantId
    await affiliationRepository.markAffiliationApproved(affiliationId, adminId, observacoes, tenantId);  // ✅ NOVO: passar tenantId
    await affiliationRepository.clearAffiliationChat(affiliationId, tenantId);  // ✅ NOVO: passar tenantId

    // Non-blocking side effects
    auditService.logAction(adminId, 'APPROVE_AFFILIATION', affiliationId, {
        user_name: user.nome_completo,
        user_cpf: user.cpf,
        observation: observacoes
    }).catch((auditErr) => {
        console.error('Audit Log Failed:', auditErr.message);
    });

    const userEmail = user.email || `${user.cpf}@empresax.com`;
    emailService.sendPasswordEmail(userEmail, tempPassword).catch((emailErr) => {
        console.error('Email Send Failed:', emailErr.message);
    });
}

// 🏢 Tenant-aware: Requires tenantId for data isolation
async function rejectAffiliation({ affiliationId, adminId, observacoes, tenantId }) {
    const filiacao = await affiliationRepository.getAffiliationById(affiliationId, tenantId);  // ✅ NOVO: passar tenantId
    if (!filiacao) {
        throw new ServiceError('Affiliation not found', 404);
    }

    const user = await affiliationRepository.getUserById(filiacao.user_id, tenantId);  // ✅ NOVO: passar tenantId

    await affiliationRepository.markAffiliationRejected(affiliationId, adminId, observacoes, tenantId);  // ✅ NOVO: passar tenantId
    await affiliationRepository.setUserPendingDocs(filiacao.user_id, tenantId);  // ✅ NOVO: passar tenantId
    await affiliationRepository.addAffiliationChatMessage(
        affiliationId,
        adminId,
        'Sua solicitação foi atualizada para "Rejeitado". Olá, estou à disposição para ajudar a corrigir as pendências.',
        tenantId  // ✅ NOVO: passar tenantId
    );

    await auditService.logAction(adminId, 'REJECT_AFFILIATION', affiliationId, {
        user_name: user?.nome_completo,
        user_cpf: user?.cpf,
        reason: observacoes
    });
}

module.exports = {
    approveAffiliation,
    rejectAffiliation,
    ServiceError
};
