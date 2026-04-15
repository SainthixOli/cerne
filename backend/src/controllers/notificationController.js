const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.createBroadcast = async (req, res) => {
    const { title, message, target_group } = req.body;
    const createdBy = req.user.id; // Admin

    // Se for Super Admin, já aprova automaticamente?
    // Regra: "Admin manda, Super Admin aprova". Mas se quem manda É o Super Admin, faz sentido auto-aprovar.
    const isSuper = req.user.role === 'super_admin';
    const status = isSuper ? 'approved' : 'pending';
    const approvedBy = isSuper ? createdBy : null;

    try {
        const db = await getDb();
        const id = uuidv4();

        await db.run(
            `INSERT INTO notifications (id, title, message, target_group, status, created_by, approved_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, title, message, target_group || 'all', status, createdBy, approvedBy]
        );

        res.status(201).json({ message: 'Broadcast created.', status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.listMyNotifications = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role; // 'professor', 'admin', 'super_admin'

    try {
        const db = await getDb();

        // Estratégia simples: 
        // Se usuário comum -> Ver notificações 'approved' && (target='all' OR target='professors')
        // Se admin -> Ver todas que ele criou? Ou ver broadcasts para admins?
        // Vamos focar no Usuário Final recebendo broadcasts.

        let query = `
            SELECT * FROM notifications 
            WHERE status = 'approved' 
            AND (target_group = 'all' OR target_group = ?)
            ORDER BY created_at DESC
        `;

        // Mapear role para grupo
        const group = role === 'professor' ? 'professors' : 'admins';

        const notifications = await db.all(query, [group]);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.listPendingBroadcasts = async (req, res) => {
    // Apenas Super Admin vê isso
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });

    try {
        const db = await getDb();
        const pending = await db.all(`
            SELECT n.*, p.nome_completo as author_name 
            FROM notifications n
            JOIN profiles p ON n.created_by = p.id
            WHERE n.status = 'pending'
            ORDER BY n.created_at ASC
        `);
        res.json(pending);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.approveBroadcast = async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
    const { id } = req.params;
    const superAdminId = req.user.id;

    try {
        const db = await getDb();
        await db.run(
            `UPDATE notifications SET status = 'approved', approved_by = ? WHERE id = ?`,
            [superAdminId, id]
        );
        res.json({ message: 'Broadcast approved and sent.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteBroadcast = async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
    const { id } = req.params;

    try {
        const db = await getDb();
        await db.run('DELETE FROM notifications WHERE id = ?', [id]);
        res.json({ message: 'Broadcast deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
