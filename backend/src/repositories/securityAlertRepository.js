const knex = require('../config/connection');

async function create(alert) {
    const [created] = await knex('security_alerts').insert({
        tenant_id: alert.tenantId,
        alert_type: alert.type,
        severity: alert.severity,
        description: alert.description,
        affected_user_id: alert.userId,
        ip_address: alert.sourceIp,
        details: JSON.stringify(alert.details)
    }).returning('id');
    return created.id;
}

function filtered(filters) {
    const query = knex('security_alerts').where({ tenant_id: filters.tenantId });
    if (filters.severity) query.where('severity', filters.severity);
    if (filters.type) query.where('alert_type', filters.type);
    return query;
}

async function list(filters) {
    const [{ count }] = await filtered(filters).clone().count('* as count');
    const alerts = await filtered(filters).orderBy('created_at', 'desc')
        .limit(filters.limit).offset(filters.offset);
    return { alerts, total: Number(count) };
}

async function findById(id, tenantId) {
    return knex('security_alerts').where({ id, tenant_id: tenantId }).first();
}

async function acknowledge(id, tenantId, adminId, notes) {
    return knex('security_alerts').where({ id, tenant_id: tenantId }).update({
        acknowledged: true,
        acknowledged_by: adminId,
        acknowledged_at: knex.fn.now(),
        admin_notes: notes || null
    });
}

async function stats(tenantId) {
    const summary = await knex('security_alerts').where({ tenant_id: tenantId }).select(
        knex.raw('COUNT(*)::integer AS total'),
        knex.raw('COUNT(*) FILTER (WHERE acknowledged = false)::integer AS active')
    ).first();
    const byType = await knex('security_alerts').select('alert_type').count('* as count')
        .where({ tenant_id: tenantId }).groupBy('alert_type');
    const bySeverity = await knex('security_alerts').select('severity').count('* as count')
        .where({ tenant_id: tenantId }).groupBy('severity');
    const recent = await knex('security_alerts').where({ tenant_id: tenantId })
        .orderBy('created_at', 'desc').limit(10);
    return { summary, byType, bySeverity, recent };
}

module.exports = { create, list, findById, acknowledge, stats };
