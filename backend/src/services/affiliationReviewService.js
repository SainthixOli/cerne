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

async function approveAffiliation({ affiliationId, adminId, observacoes }) {
    const adminExists = await affiliationRepository.getAdminById(adminId);
    if (!adminExists) {
        throw new ServiceError('Sessão inválida ou expirada. Por favor, faça login novamente.', 401);
    }

    const filiacao = await affiliationRepository.getAffiliationById(affiliationId);
    if (!filiacao) {
        throw new ServiceError('Affiliation not found', 404);
    }

    const user = await affiliationRepository.getUserById(filiacao.user_id);
    if (!user) {
        throw new ServiceError('User associated with this affiliation not found.', 404);
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await affiliationRepository.activateUserWithPassword(filiacao.user_id, hashedPassword);
    await affiliationRepository.markAffiliationApproved(affiliationId, adminId, observacoes);
    await affiliationRepository.clearAffiliationChat(affiliationId);

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

async function rejectAffiliation({ affiliationId, adminId, observacoes }) {
    const filiacao = await affiliationRepository.getAffiliationById(affiliationId);
    if (!filiacao) {
        throw new ServiceError('Affiliation not found', 404);
    }

    const user = await affiliationRepository.getUserById(filiacao.user_id);

    await affiliationRepository.markAffiliationRejected(affiliationId, adminId, observacoes);
    await affiliationRepository.setUserPendingDocs(filiacao.user_id);
    await affiliationRepository.addAffiliationChatMessage(
        affiliationId,
        adminId,
        'Sua solicitação foi atualizada para "Rejeitado". Olá, estou à disposição para ajudar a corrigir as pendências.'
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
