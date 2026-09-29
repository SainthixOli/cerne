const affiliationRepository = require('../repositories/affiliationRepository');

class QueryServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// The public route resolves and validates tenant before looking up the CPF.
async function checkStatusByCpf(cpf, tenantId) {
    const cleanCpf = cpf.replace(/\D/g, '');
    const user = await affiliationRepository.findUserByCpfNormalized(cleanCpf, tenantId);
    if (!user) {
        throw new QueryServiceError('CPF não encontrado.', 404);
    }

    const filiacao = await affiliationRepository.getLatestAffiliationByUserId(user.id, tenantId);
    if (!filiacao) {
        throw new QueryServiceError('Nenhuma solicitação encontrada.', 404);
    }

    return {
        id: filiacao.id,
        nome: user.nome_completo,
        status: filiacao.status,
        observacoes: filiacao.observacoes_admin,
        status_conta: user.status_conta,
        protocolo: filiacao.protocolo || 'Pendente',
        responsavel: filiacao.responsavel_nome || null,
        status_atendimento: filiacao.status_atendimento
    };
}

// 🏢 Tenant-aware: Used for authenticated users - requires tenantId
async function getAffiliationHistory(userId, tenantId) {
    return affiliationRepository.getAffiliationHistoryByUserId(userId, tenantId);
}

module.exports = {
    checkStatusByCpf,
    getAffiliationHistory,
    QueryServiceError
};
