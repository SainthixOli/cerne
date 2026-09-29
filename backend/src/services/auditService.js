const auditRepository = require('../repositories/auditRepository');

exports.logAction = async (adminId, actionType, targetId, details, tenantId) => {
    try {
        await auditRepository.create({
            admin_id: adminId,
            action_type: actionType,
            target_id: targetId,
            details: JSON.stringify(details),
            tenant_id: tenantId
        });
    } catch (error) {
        console.error('Failed to log audit action:', error);
        // Don't throw, we don't want to break the main flow if logging fails
    }
};

exports.getLogs = async (tenantId) => {
    return auditRepository.list(tenantId);
};

exports.getLogsForAdmin = async (adminId, tenantId) => auditRepository.listForAdmin(adminId, tenantId);
