const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Iniciar ou Obter Conversa Existente
// Iniciar ou Obter Conversa Existente
exports.startConversation = async (req, res) => {
    const { userId } = req.body; // ID do ALVO (se sou admin, é user_id; se sou user, é admin_id)
    const myId = req.user.id;
    const role = req.user.role;

    try {
        const db = await getDb();
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

        // Verificar se já existe conversa entre eles
        let conversation = await db.get(
            `SELECT * FROM conversations WHERE admin_id = ? AND user_id = ?`,
            [adminId, targetUserId]
        );

        if (!conversation) {
            const id = uuidv4();
            await db.run(
                `INSERT INTO conversations (id, admin_id, user_id) VALUES (?, ?, ?)`,
                [id, adminId, targetUserId]
            );
            conversation = { id, admin_id: adminId, user_id: targetUserId };
        }

        res.json(conversation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.listConversations = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        const db = await getDb();
        let query = '';
        let params = [];
        const { mode } = req.query; // 'all' for spectator, undefined/null for personal

        // If Super Admin AND specifically asking for all chats (Monitor Mode)
        if (role === 'super_admin' && mode === 'all') {
            query = `
                SELECT c.*, p.nome_completo as peer_name, p.role as peer_role,
                (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                admin_p.nome_completo as admin_name
                FROM conversations c
                JOIN profiles p ON c.user_id = p.id
                LEFT JOIN profiles admin_p ON c.admin_id = admin_p.id
                ORDER BY c.last_updated DESC
            `;
            params = [];
        }
        // Admin OR (Super Admin in Personal Mode)
        else if (role === 'admin' || role === 'super_admin') {
            // See their OWN conversations
            query = `
                SELECT c.*, p.nome_completo as peer_name, p.role as peer_role,
                (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
                FROM conversations c
                JOIN profiles p ON c.user_id = p.id
                WHERE c.admin_id = ?
                ORDER BY c.last_updated DESC
            `;
            params = [userId];
        } else {
            // Member
            query = `
                SELECT c.*, p.nome_completo as peer_name, p.role as peer_role,
                (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
                FROM conversations c
                JOIN profiles p ON c.admin_id = p.id
                WHERE c.user_id = ?
                ORDER BY c.last_updated DESC
            `;
            params = [userId];
        }

        const conversations = await db.all(query, params);
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMessages = async (req, res) => {
    const { conversationId } = req.params;

    try {
        const db = await getDb();

        // Auto-clean: Deletar mensagens com mais de 7 dias (opcional, manter se user pediu, mas não pediu agora)
        // await db.run(`DELETE FROM messages WHERE conversation_id = ? AND created_at < date('now', '-7 days')`, [conversationId]);

        const messages = await db.all(`
            SELECT m.*, p.nome_completo as sender_name 
            FROM messages m
            JOIN profiles p ON m.sender_id = p.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
        `, [conversationId]);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const { hasProfanity } = require('../utils/profanity');

exports.sendMessage = async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    // Filtro de Palavras
    if (hasProfanity(content)) {
        return res.status(400).json({ error: 'Mensagem inadequada. Por favor, atente-se às regras do chat.' });
    }

    try {
        const db = await getDb();
        const id = uuidv4();

        await db.run(
            `INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)`,
            [id, conversationId, senderId, content]
        );

        // Atualizar last_updated da conversa
        await db.run(`UPDATE conversations SET last_updated = CURRENT_TIMESTAMP WHERE id = ?`, [conversationId]);

        res.json({ id, content, created_at: new Date() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAvailableAdmins = async (req, res) => {
    try {
        const db = await getDb();
        const admins = await db.all("SELECT id, nome_completo, role FROM profiles WHERE role IN ('admin', 'super_admin') AND status_conta = 'ativo'");
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
