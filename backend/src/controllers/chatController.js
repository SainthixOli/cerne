const { v4: uuidv4 } = require('uuid');
const { sendError } = require('../utils/apiResponse');
const knex = require('../config/connection');
const chatRepository = require('../repositories/chatRepository');

// Iniciar ou Obter Conversa Existente
// Iniciar ou Obter Conversa Existente
exports.startConversation = async (req, res) => {
    const { userId } = req.body; // ID do ALVO (se sou admin, é user_id; se sou user, é admin_id)
    const myId = req.user.id;
    const role = req.user.role;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    try {
        let adminId, targetUserId;

        if (role === 'admin' || role === 'super_admin') {
            adminId = myId;
            targetUserId = userId;
        } else {
            // Se sou usuário comum, estou tentando falar com um admin
            adminId = userId; // O alvo é o admin
            targetUserId = myId; // Eu sou o usuário
        }

        if (!adminId || !targetUserId) {
            return res.status(400).json({ error: "IDs inválidos para iniciar conversa." });
        }

        const participants = await chatRepository.findParticipants([adminId, targetUserId], tenantId);
        const admin = participants.find((profile) => profile.id === adminId);
        const member = participants.find((profile) => profile.id === targetUserId);
        if (!admin || !['admin', 'super_admin'].includes(admin.role) ||
            !member || member.role !== 'professor') {
            return res.status(403).json({ error: 'Participantes inválidos para este tenant' });
        }

        // Verificar se já existe conversa entre eles
        const conversation = await knex.transaction(async (trx) =>
            (await chatRepository.findConversation(adminId, targetUserId, tenantId, trx)) ||
            chatRepository.createConversation(uuidv4(), adminId, targetUserId, tenantId, trx));

        res.json(conversation);
    } catch (error) {
        console.error(error);
        return sendError(res, 500, undefined, 'CONVERSATION_START_FAILED');
    }
};

exports.listConversations = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    try {
        const { mode } = req.query; // 'all' for spectator, undefined/null for personal
        const conversations = await chatRepository.listConversations(userId, role, tenantId, mode);
        res.json(conversations);
    } catch (error) {
        return sendError(res, 500, undefined, 'CONVERSATION_LIST_FAILED');
    }
};

exports.getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    try {
        const messages = await chatRepository.listMessages(conversationId, tenantId);

        res.json(messages);
    } catch (error) {
        return sendError(res, 500, undefined, 'MESSAGE_LIST_FAILED');
    }
};

const { hasProfanity } = require('../utils/profanity');

exports.sendMessage = async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    // Filtro de Palavras
    if (hasProfanity(content)) {
        return res.status(400).json({ error: 'Mensagem inadequada. Por favor, atente-se às regras do chat.' });
    }

    try {
        const id = uuidv4();
        await chatRepository.createMessage({ id, conversationId, senderId, content, tenantId });

        res.json({ id, content, created_at: new Date() });
    } catch (error) {
        return sendError(res, 500, undefined, 'MESSAGE_SEND_FAILED');
    }
};

exports.getAvailableAdmins = async (req, res) => {
    try {
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const admins = await chatRepository.listAvailableAdmins(tenantId);
        res.json(admins);
    } catch (error) {
        return sendError(res, 500, undefined, 'ADMIN_LIST_FAILED');
    }
};
