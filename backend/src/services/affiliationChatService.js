const affiliationRepository = require('../repositories/affiliationRepository');
const { hasProfanity } = require('../utils/profanity');

class ChatServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

function hasAccess({ cpfHeader, reqUser, filiacao }) {
    const isPublicAccess = cpfHeader && filiacao.cpf.replace(/\D/g, '') === cpfHeader.replace(/\D/g, '');
    const isAuthAccess = reqUser && (
        reqUser.role === 'admin' ||
        reqUser.role === 'super_admin' ||
        reqUser.id === filiacao.user_id
    );
    return { isPublicAccess, isAuthAccess };
}

// 🏢 Discover tenantId based on authentication or public access
async function resolveTenantId(cpfHeader, reqUser) {
    if (reqUser) {
        return reqUser.tenantId;  // Authenticated: use from JWT
    }
    if (cpfHeader) {
        // Public access: discover tenant from CPF
        const cleanCpf = cpfHeader.replace(/\D/g, '');
        const user = await affiliationRepository.findUserByCpfNormalized(cleanCpf);
        if (!user) {
            throw new ChatServiceError('Usuário não encontrado', 404);
        }
        const { getDb } = require('../config/database');
        const db = await getDb();
        const tenantRecord = await db.get(
            'SELECT tenant_id FROM tenant_super_admins WHERE user_id = ? LIMIT 1',
            [user.id]
        );
        return tenantRecord?.tenant_id || 1;  // Default: tenant 1
    }
    throw new ChatServiceError('Nenhum tenant identificado', 401);
}

// 🏢 Tenant-aware: Requires tenantId for data isolation
async function getChatMessages({ affiliationId, cpfHeader, reqUser, tenantId }) {
    // If tenantId not passed, resolve it
    if (!tenantId) {
        tenantId = await resolveTenantId(cpfHeader, reqUser);
    }

    const filiacao = await affiliationRepository.getAffiliationWithOwnerAndStatus(affiliationId, tenantId);  // ✅ NOVO: passar tenantId
    if (!filiacao) {
        throw new ChatServiceError('Filiation not found', 404);
    }

    const access = hasAccess({ cpfHeader, reqUser, filiacao });
    if (!access.isPublicAccess && !access.isAuthAccess) {
        throw new ChatServiceError('Access denied', 403);
    }

    if (filiacao.status === 'rejeitado') {
        await affiliationRepository.deleteOldRejectedChatMessages(affiliationId, tenantId);  // ✅ NOVO: passar tenantId
    }

    return affiliationRepository.getChatMessagesByAffiliationId(affiliationId, tenantId);  // ✅ NOVO: passar tenantId
}

// 🏢 Tenant-aware: Requires tenantId for data isolation
async function sendChatMessage({ affiliationId, message, cpfHeader, reqUser, tenantId }) {
    if (hasProfanity(message)) {
        throw new ChatServiceError('Mensagem inadequada. Por favor, atente-se às regras do chat.', 400);
    }

    // If tenantId not passed, resolve it
    if (!tenantId) {
        tenantId = await resolveTenantId(cpfHeader, reqUser);
    }

    const filiacao = await affiliationRepository.getAffiliationWithOwnerAndStatus(affiliationId, tenantId);  // ✅ NOVO: passar tenantId
    if (!filiacao) {
        throw new ChatServiceError('Filiation not found', 404);
    }

    let senderId;
    const access = hasAccess({ cpfHeader, reqUser, filiacao });
    if (access.isPublicAccess) {
        senderId = filiacao.user_id;
    } else if (access.isAuthAccess) {
        senderId = reqUser.id;
    } else {
        throw new ChatServiceError('Access denied', 403);
    }

    await affiliationRepository.addAffiliationChatMessage(affiliationId, senderId, message, tenantId);  // ✅ NOVO: passar tenantId
}

module.exports = {
    getChatMessages,
    sendChatMessage,
    ChatServiceError
};
