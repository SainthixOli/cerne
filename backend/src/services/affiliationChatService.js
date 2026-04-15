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

async function getChatMessages({ affiliationId, cpfHeader, reqUser }) {
    const filiacao = await affiliationRepository.getAffiliationWithOwnerAndStatus(affiliationId);
    if (!filiacao) {
        throw new ChatServiceError('Filiation not found', 404);
    }

    const access = hasAccess({ cpfHeader, reqUser, filiacao });
    if (!access.isPublicAccess && !access.isAuthAccess) {
        throw new ChatServiceError('Access denied', 403);
    }

    if (filiacao.status === 'rejeitado') {
        await affiliationRepository.deleteOldRejectedChatMessages(affiliationId);
    }

    return affiliationRepository.getChatMessagesByAffiliationId(affiliationId);
}

async function sendChatMessage({ affiliationId, message, cpfHeader, reqUser }) {
    if (hasProfanity(message)) {
        throw new ChatServiceError('Mensagem inadequada. Por favor, atente-se às regras do chat.', 400);
    }

    const filiacao = await affiliationRepository.getAffiliationWithOwnerAndStatus(affiliationId);
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

    await affiliationRepository.addAffiliationChatMessage(affiliationId, senderId, message);
}

module.exports = {
    getChatMessages,
    sendChatMessage,
    ChatServiceError
};
