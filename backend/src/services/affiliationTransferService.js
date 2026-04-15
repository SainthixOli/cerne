const auditService = require('./auditService');
const affiliationRepository = require('../repositories/affiliationRepository');

class TransferServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

async function assumeAffiliation({ affiliationId, adminId, adminName }) {
    const current = await affiliationRepository.getAffiliationAssignmentById(affiliationId);
    if (!current) {
        throw new TransferServiceError('Affiliation not found', 404);
    }

    if (current.responsavel_admin_id && current.responsavel_admin_id !== adminId) {
        throw new TransferServiceError('Este protocolo já está sendo atendido por outro administrador.', 400);
    }

    if (current.responsavel_admin_id === adminId) {
        return { alreadyAssigned: true, protocol: current.protocolo };
    }

    await affiliationRepository.setAffiliationAssignee(affiliationId, adminId);
    await affiliationRepository.addAffiliationChatMessage(
        affiliationId,
        adminId,
        `Olá, eu sou o administrador ${adminName} e assumi seu protocolo ${current.protocolo}. Como posso ajudar?`
    );

    return { alreadyAssigned: false, protocol: current.protocolo };
}

async function requestTransfer({ affiliationId, adminId }) {
    const filiacao = await affiliationRepository.getAffiliationAssignmentById(affiliationId);
    if (!filiacao) {
        throw new TransferServiceError('Filiation not found', 404);
    }
    if (filiacao.responsavel_admin_id !== adminId) {
        throw new TransferServiceError('Você não é o responsável por este protocolo.', 403);
    }

    await affiliationRepository.setTransferStatusPending(affiliationId);
}

async function denyTransferRequest({ affiliationId, requesterId, requesterRole }) {
    if (requesterRole !== 'super_admin') {
        throw new TransferServiceError('Apenas Super Admins podem gerenciar transferências.', 403);
    }

    const filiacao = await affiliationRepository.getAffiliationAssignmentById(affiliationId);
    if (!filiacao) {
        throw new TransferServiceError('Filiação não encontrada.', 404);
    }

    await affiliationRepository.clearTransferStatus(affiliationId);
    await affiliationRepository.addAffiliationChatMessage(
        affiliationId,
        requesterId,
        'Solicitação de transferência negada.'
    );
}

async function transferAffiliation({ affiliationId, targetAdminId, requesterId, requesterRole }) {
    if (requesterRole !== 'super_admin') {
        throw new TransferServiceError('Apenas Super Admins podem transferir atendimentos.', 403);
    }

    const current = await affiliationRepository.getAffiliationAssignmentById(affiliationId);
    if (!current) {
        throw new TransferServiceError('Filiação não encontrada.', 404);
    }

    const targetAdmin = await affiliationRepository.getAdminProfileById(targetAdminId);
    if (!targetAdmin) {
        throw new TransferServiceError('Admin de destino não encontrado.', 404);
    }

    await affiliationRepository.transferAffiliationToAdmin(affiliationId, targetAdminId);
    await affiliationRepository.addAffiliationChatMessage(
        affiliationId,
        requesterId,
        `Atendimento transferido para o administrador ${targetAdmin.nome_completo}.`
    );
    await auditService.logAction(requesterId, 'TRANSFER_AFFILIATION', affiliationId, {
        from: current.responsavel_admin_id,
        to: targetAdminId,
        to_name: targetAdmin.nome_completo
    });

    return { targetAdminName: targetAdmin.nome_completo };
}

module.exports = {
    assumeAffiliation,
    requestTransfer,
    denyTransferRequest,
    transferAffiliation,
    TransferServiceError
};
