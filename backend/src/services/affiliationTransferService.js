const auditService = require('./auditService');
const affiliationRepository = require('../repositories/affiliationRepository');
const knex = require('../config/connection');

class TransferServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

async function assumeAffiliation({ affiliationId, adminId, adminName, tenantId }) {
    return knex.transaction(async (trx) => {
        const current = await affiliationRepository.getAffiliationAssignmentById(affiliationId, tenantId, trx);
        if (!current) throw new TransferServiceError('Affiliation not found', 404);

        if (current.responsavel_admin_id && current.responsavel_admin_id !== adminId) {
            throw new TransferServiceError('Este protocolo já está sendo atendido por outro administrador.', 400);
        }
        if (current.responsavel_admin_id === adminId) {
            return { alreadyAssigned: true, protocol: current.protocolo };
        }

        const assigned = await affiliationRepository.setAffiliationAssignee(
            affiliationId, adminId, tenantId, trx
        );
        await affiliationRepository.addAffiliationChatMessage(
            affiliationId,
            adminId,
            `Olá, eu sou o administrador ${adminName} e assumi seu protocolo ${current.protocolo}.`,
            tenantId,
            trx
        );
        if (assigned !== 1) throw new Error('Atomic affiliation assignment failed');
        return { alreadyAssigned: false, protocol: current.protocolo };
    });
}

async function requestTransfer({ affiliationId, adminId, tenantId }) {
    await knex.transaction(async (trx) => {
        const filiacao = await affiliationRepository.getAffiliationAssignmentById(affiliationId, tenantId, trx);
        if (!filiacao) throw new TransferServiceError('Filiation not found', 404);
        if (filiacao.responsavel_admin_id !== adminId) {
            throw new TransferServiceError('Você não é o responsável por este protocolo.', 403);
        }
        const changed = await affiliationRepository.setTransferStatusPending(affiliationId, tenantId, trx);
        if (changed !== 1) throw new Error('Atomic transfer request failed');
    });
}

async function denyTransferRequest({ affiliationId, requesterId, requesterRole, tenantId }) {
    if (requesterRole !== 'super_admin') {
        throw new TransferServiceError('Apenas Super Admins podem gerenciar transferências.', 403);
    }

    await knex.transaction(async (trx) => {
        const filiacao = await affiliationRepository.getAffiliationAssignmentById(affiliationId, tenantId, trx);
        if (!filiacao) throw new TransferServiceError('Filiação não encontrada.', 404);

        const changed = await affiliationRepository.clearTransferStatus(affiliationId, tenantId, trx);
        await affiliationRepository.addAffiliationChatMessage(
            affiliationId, requesterId, 'Solicitação de transferência negada.', tenantId, trx
        );
        if (changed !== 1) throw new Error('Atomic transfer denial failed');
    });
}

async function transferAffiliation({ affiliationId, targetAdminId, requesterId, requesterRole, tenantId }) {
    if (requesterRole !== 'super_admin') {
        throw new TransferServiceError('Apenas Super Admins podem transferir atendimentos.', 403);
    }

    let current;
    let targetAdmin;
    await knex.transaction(async (trx) => {
        current = await affiliationRepository.getAffiliationAssignmentById(affiliationId, tenantId, trx);
        if (!current) throw new TransferServiceError('Filiação não encontrada.', 404);

        targetAdmin = await affiliationRepository.getAdminProfileById(targetAdminId, tenantId, trx);
        if (!targetAdmin) throw new TransferServiceError('Admin de destino não encontrado.', 404);

        const changed = await affiliationRepository.transferAffiliationToAdmin(
            affiliationId, targetAdminId, tenantId, trx
        );
        await affiliationRepository.addAffiliationChatMessage(
            affiliationId,
            requesterId,
            `Atendimento transferido para o administrador ${targetAdmin.nome_completo}.`,
            tenantId,
            trx
        );
        if (changed !== 1) throw new Error('Atomic affiliation transfer failed');
    });
    await auditService.logAction(requesterId, 'TRANSFER_AFFILIATION', affiliationId, {
        from: current.responsavel_admin_id,
        to: targetAdminId,
        to_name: targetAdmin.nome_completo
    }, tenantId);

    return { targetAdminName: targetAdmin.nome_completo };
}

module.exports = {
    assumeAffiliation,
    requestTransfer,
    denyTransferRequest,
    transferAffiliation,
    TransferServiceError
};
