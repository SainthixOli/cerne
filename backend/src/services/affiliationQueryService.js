const affiliationRepository = require('../repositories/affiliationRepository');

class QueryServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

async function checkStatusByCpf(cpf) {
    const cleanCpf = cpf.replace(/\D/g, '');
    const user = await affiliationRepository.findUserByCpfNormalized(cleanCpf);
    if (!user) {
        throw new QueryServiceError('CPF não encontrado.', 404);
    }

    const filiacao = await affiliationRepository.getLatestAffiliationByUserId(user.id);
    if (!filiacao) {
        throw new QueryServiceError('Nenhuma solicitação encontrada.', 404);
    }

    const messageCount = await affiliationRepository.countChatMessagesByAffiliationId(filiacao.id);

    return {
        id: filiacao.id,
        nome: user.nome_completo,
        status: filiacao.status,
        observacoes: filiacao.observacoes_admin,
        status_conta: user.status_conta,
        message_count: messageCount?.count || 0,
        protocolo: filiacao.protocolo || 'Pendente',
        responsavel: filiacao.responsavel_nome || null,
        status_atendimento: filiacao.status_atendimento
    };
}

async function getAffiliationHistory(userId) {
    return affiliationRepository.getAffiliationHistoryByUserId(userId);
}

module.exports = {
    checkStatusByCpf,
    getAffiliationHistory,
    QueryServiceError
};
