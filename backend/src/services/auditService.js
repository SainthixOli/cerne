const { getDb } = require('../config/database');

exports.logAction = async (adminId, actionType, targetId, details, tenantId) => {
    try {
        const db = await getDb();
        await db.run(
            `INSERT INTO audit_logs (admin_id, action_type, target_id, details, tenant_id) VALUES (?, ?, ?, ?, ?)`,
            [adminId, actionType, targetId, JSON.stringify(details), tenantId]
        );
    } catch (error) {
        console.error('Failed to log audit action:', error);
        // Don't throw, we don't want to break the main flow if logging fails
    }
};

exports.getLogs = async (tenantId) => {
    const db = await getDb();
    return await db.all(`
        SELECT a.*, p.nome_completo as admin_name 
        FROM audit_logs a
        LEFT JOIN profiles p ON a.admin_id = p.id AND p.tenant_id = ?
        WHERE a.tenant_id = ?
        ORDER BY a.created_at DESC
    `, [tenantId, tenantId]);
};
