const chatRepository = require('../repositories/chatRepository');

const authorizeConversation = ({ write }) => async (req, res, next) => {
    try {
        const conversation = await chatRepository.findConversationForAccess(
            req.params.conversationId, req.tenantId);
        if (!conversation) return res.status(404).json({ error: 'Conversa não encontrada' });

        const participant = req.user.id === conversation.admin_id || req.user.id === conversation.user_id;
        const monitor = !write && req.user.role === 'super_admin';
        if (!participant && !monitor) return res.status(403).json({ error: 'Acesso negado' });
        req.conversation = conversation;
        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports = { authorizeConversation };
