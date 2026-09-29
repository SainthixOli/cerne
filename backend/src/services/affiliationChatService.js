const affiliationRepository = require('../repositories/affiliationRepository');
const { hasProfanity } = require('../utils/profanity');

class ChatServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

function hasAccess({ reqUser, filiacao }) {
    const participant = reqUser && (
        reqUser.id === filiacao.user_id ||
        (filiacao.responsavel_admin_id && reqUser.id === filiacao.responsavel_admin_id)
    );
    const monitor = reqUser?.role === 'super_admin';
    return { canRead: participant || monitor, canWrite: Boolean(participant) };
}

// 🏢 Tenant-aware: Requires tenantId for data isolation
async function getChatMessages({ affiliationId, reqUser, tenantId }) {
    if (!tenantId) throw new ChatServiceError('Nenhum tenant identificado', 400);

    const filiacao = await affiliationRepository.getAffiliationWithOwnerAndStatus(affiliationId, tenantId);  // ✅ NOVO: passar tenantId
    if (!filiacao) {
        throw new ChatServiceError('Filiation not found', 404);
    }

    const access = hasAccess({ reqUser, filiacao });
    if (!access.canRead) {
        throw new ChatServiceError('Access denied', 403);
    }

    return affiliationRepository.getChatMessagesByAffiliationId(affiliationId, tenantId);  // ✅ NOVO: passar tenantId
}

// 🏢 Tenant-aware: Requires tenantId for data isolation
async function sendChatMessage({ affiliationId, message, reqUser, tenantId }) {
    if (hasProfanity(message)) {
        throw new ChatServiceError('Mensagem inadequada. Por favor, atente-se às regras do chat.', 400);
    }

    if (!tenantId) throw new ChatServiceError('Nenhum tenant identificado', 400);

    const filiacao = await affiliationRepository.getAffiliationWithOwnerAndStatus(affiliationId, tenantId);  // ✅ NOVO: passar tenantId
    if (!filiacao) {
        throw new ChatServiceError('Filiation not found', 404);
    }

    const access = hasAccess({ reqUser, filiacao });
    if (!access.canWrite) {
        throw new ChatServiceError('Access denied', 403);
    }

    await affiliationRepository.addAffiliationChatMessage(affiliationId, reqUser.id, message, tenantId);
}

module.exports = {
    getChatMessages,
    sendChatMessage,
    ChatServiceError
};
