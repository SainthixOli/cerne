const affiliationRepository = require('../repositories/affiliationRepository');

class QueryServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// 🌐 Tenant-agnostic: Used for public status check (no authentication required)
// Discovers tenant from user's CPF, then uses it for queries
async function checkStatusByCpf(cpf) {
    const cleanCpf = cpf.replace(/\D/g, '');
    const user = await affiliationRepository.findUserByCpfNormalized(cleanCpf);
    if (!user) {
        throw new QueryServiceError('CPF não encontrado.', 404);
    }

    // 🏢 For public endpoint: discover tenant from user, default to tenant 1
    const { getDb } = require('../config/database');
    const db = await getDb();
    const tenantRecord = await db.get(
        'SELECT tenant_id FROM tenant_super_admins WHERE user_id = ? LIMIT 1',
        [user.id]
    );
    const tenantId = tenantRecord?.tenant_id || 1;

    const filiacao = await affiliationRepository.getLatestAffiliationByUserId(user.id, tenantId);
    if (!filiacao) {
        throw new QueryServiceError('Nenhuma solicitação encontrada.', 404);
    }

    const messageCount = await affiliationRepository.countChatMessagesByAffiliationId(filiacao.id, tenantId);

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

// 🏢 Tenant-aware: Used for authenticated users - requires tenantId
async function getAffiliationHistory(userId, tenantId) {
    return affiliationRepository.getAffiliationHistoryByUserId(userId, tenantId);
}

module.exports = {
    checkStatusByCpf,
    getAffiliationHistory,
    QueryServiceError
};
