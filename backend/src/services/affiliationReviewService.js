const bcrypt = require('bcrypt');
const outboxService = require('./outboxService');
const auditService = require('./auditService');
const affiliationRepository = require('../repositories/affiliationRepository');
const crypto = require('crypto');
const knex = require('../config/connection');

function generateInitialPassword() {
    const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%&*?'];
    const all = groups.join('');
    const characters = groups.map((group) => group[crypto.randomInt(group.length)]);
    while (characters.length < 16) characters.push(all[crypto.randomInt(all.length)]);
    for (let index = characters.length - 1; index > 0; index -= 1) {
        const swapIndex = crypto.randomInt(index + 1);
        [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
    }
    return characters.join('');
}

class ServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// 🏢 Tenant-aware: Requires tenantId for data isolation
async function approveAffiliation({ affiliationId, adminId, observacoes, tenantId }) {
    const tempPassword = generateInitialPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    let user;

    await knex.transaction(async (trx) => {
        const adminExists = await affiliationRepository.getAdminById(adminId, tenantId, trx);
        if (!adminExists) {
            throw new ServiceError('Sessão inválida ou expirada. Por favor, faça login novamente.', 401);
        }

        const filiacao = await affiliationRepository.getAffiliationById(affiliationId, tenantId, trx);
        if (!filiacao) throw new ServiceError('Affiliation not found', 404);

        user = await affiliationRepository.getUserById(filiacao.user_id, tenantId, trx);
        if (!user) throw new ServiceError('User associated with this affiliation not found.', 404);

        const activated = await affiliationRepository.activateUserWithPassword(
            filiacao.user_id, hashedPassword, tenantId, trx
        );
        const approved = await affiliationRepository.markAffiliationApproved(
            affiliationId, adminId, observacoes, tenantId, trx
        );
        if (activated !== 1 || approved !== 1) throw new Error('Atomic affiliation approval failed');
        const recipient = user.email;
        if (!recipient) throw new ServiceError('Usuário sem email para entrega de credencial.', 409);
        await outboxService.enqueue({
            tenantId,
            eventType: 'PASSWORD_CREATED',
            payload: { recipient, temporaryPassword: tempPassword },
            transaction: trx
        });
    });

    // Non-blocking side effects
    auditService.logAction(adminId, 'APPROVE_AFFILIATION', affiliationId, {
        user_name: user.nome_completo,
        user_cpf: user.cpf,
        observation: observacoes
    }, tenantId).catch((auditErr) => {
        console.error('Audit Log Failed:', auditErr.message);
    });

}

// 🏢 Tenant-aware: Requires tenantId for data isolation
async function rejectAffiliation({ affiliationId, adminId, observacoes, tenantId }) {
    let user;
    await knex.transaction(async (trx) => {
        const filiacao = await affiliationRepository.getAffiliationById(affiliationId, tenantId, trx);
        if (!filiacao) throw new ServiceError('Affiliation not found', 404);

        user = await affiliationRepository.getUserById(filiacao.user_id, tenantId, trx);
        if (!user) throw new ServiceError('User associated with this affiliation not found.', 404);

        const rejected = await affiliationRepository.markAffiliationRejected(
            affiliationId, adminId, observacoes, tenantId, trx
        );
        const pending = await affiliationRepository.setUserPendingDocs(filiacao.user_id, tenantId, trx);
        await affiliationRepository.addAffiliationChatMessage(
            affiliationId,
            adminId,
            'Sua solicitação foi atualizada para "Rejeitado". Olá, estou à disposição para ajudar a corrigir as pendências.',
            tenantId,
            trx
        );
        if (rejected !== 1 || pending !== 1) throw new Error('Atomic affiliation rejection failed');
    });

    await auditService.logAction(adminId, 'REJECT_AFFILIATION', affiliationId, {
        user_name: user?.nome_completo,
        user_cpf: user?.cpf,
        reason: observacoes
    }, tenantId);
}

module.exports = {
    approveAffiliation,
    rejectAffiliation,
    ServiceError
};
