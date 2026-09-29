const knex = require('../config/connection');

async function summary(tenantId) {
    const row = await knex('filiacoes').where({ tenant_id: tenantId }).select(
        knex.raw('COUNT(*)::integer AS total'),
        knex.raw("COUNT(*) FILTER (WHERE status IN ('em_analise', 'em_processamento'))::integer AS pending"),
        knex.raw("COUNT(*) FILTER (WHERE status = 'concluido')::integer AS approved"),
        knex.raw("COUNT(*) FILTER (WHERE status = 'rejeitado')::integer AS rejected"),
        knex.raw("COUNT(*) FILTER (WHERE data_solicitacao::date = CURRENT_DATE)::integer AS today"),
        knex.raw(`COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (data_aprovacao - data_solicitacao)) / 3600)::numeric, 1), 0) AS avg_approval_hours`)
    ).first();
    return row;
}

async function monthly(tenantId) {
    return knex('filiacoes').select(knex.raw("to_char(data_solicitacao, 'YYYY-MM') AS month"))
        .count('* as count').where({ tenant_id: tenantId }).groupBy('month').orderBy('month').limit(12);
}

async function statusDistribution(tenantId) {
    return knex('filiacoes').select('status').count('* as count')
        .where({ tenant_id: tenantId }).groupBy('status');
}

async function rejectionReasons(tenantId) {
    return knex('filiacoes').select('observacoes_admin as reason').count('* as count')
        .where({ status: 'rejeitado', tenant_id: tenantId })
        .groupBy('observacoes_admin').orderBy('count', 'desc').limit(5);
}

module.exports = { summary, monthly, statusDistribution, rejectionReasons };
