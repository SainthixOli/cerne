const knex = require('../config/connection');
const auditRepository = require('./auditRepository');

async function createAdmin({ id, name, cpf, email, passwordHash, tenantId, actorId }) {
    return knex.transaction(async (trx) => {
        const existing = await trx('profiles').where({ cpf, tenant_id: tenantId }).first('id');
        if (existing) return false;
        await trx('profiles').insert({
            id,
            nome_completo: name,
            cpf,
            email,
            password_hash: passwordHash,
            role: 'admin',
            status_conta: 'ativo',
            tenant_id: tenantId
        });
        await auditRepository.create({
            admin_id: actorId,
            action_type: 'CREATE_ADMIN',
            target_id: id,
            details: JSON.stringify({ changedFields: ['nome_completo', 'cpf', 'email', 'role'] }),
            tenant_id: tenantId
        }, trx);
        return true;
    });
}

async function listAdmins(tenantId) {
    return knex('profiles').select('id', 'nome_completo', 'cpf', 'email', 'role', 'status_conta')
        .whereIn('role', ['admin', 'super_admin']).andWhere({ tenant_id: tenantId });
}

async function getPerformance(adminId, month, tenantId) {
    const row = await knex('filiacoes')
        .select(knex.raw("COUNT(*) FILTER (WHERE status = 'concluido')::integer AS approved"))
        .select(knex.raw("COUNT(*) FILTER (WHERE status = 'rejeitado')::integer AS rejected"))
        .where({ aprovado_por_admin_id: adminId, tenant_id: tenantId })
        .whereRaw("to_char(data_aprovacao, 'YYYY-MM') = ?", [month])
        .first();
    return row || { approved: 0, rejected: 0 };
}

async function saveEvaluation(evaluation, actorId) {
    return knex.transaction(async (trx) => {
        await trx('admin_evaluations').insert(evaluation)
            .onConflict(['tenant_id', 'admin_id', 'month_ref'])
            .merge([
                'score', 'feedback', 'evaluator_id', 'criteria_productivity', 'criteria_quality',
                'criteria_proactivity', 'criteria_punctuality', 'visible_to_collaborator'
            ]);
        await auditRepository.create({
            admin_id: actorId,
            action_type: 'EVALUATE_ADMIN',
            target_id: evaluation.admin_id,
            details: JSON.stringify({ month: evaluation.month_ref, score: evaluation.score }),
            tenant_id: evaluation.tenant_id
        }, trx);
    });
}

async function listEvaluations(adminId, tenantId, includePrivate) {
    const query = knex('admin_evaluations as evaluation')
        .leftJoin('profiles as evaluator', function joinEvaluator() {
            this.on('evaluation.evaluator_id', '=', 'evaluator.id')
                .andOn('evaluation.tenant_id', '=', 'evaluator.tenant_id');
        })
        .select('evaluation.*', 'evaluator.nome_completo as evaluator_name')
        .where({ 'evaluation.admin_id': adminId, 'evaluation.tenant_id': tenantId });
    if (!includePrivate) query.where('evaluation.visible_to_collaborator', true);
    return query.orderBy('evaluation.month_ref', 'desc');
}

async function updateAdminStatus(adminId, status, tenantId, actorId) {
    return knex.transaction(async (trx) => {
        const updated = await trx('profiles').where({ id: adminId, tenant_id: tenantId })
            .whereIn('role', ['admin', 'super_admin']).update({ status_conta: status });
        if (updated !== 1) return false;
        await auditRepository.create({
            admin_id: actorId,
            action_type: 'UPDATE_ADMIN_STATUS',
            target_id: adminId,
            details: JSON.stringify({ status }),
            tenant_id: tenantId
        }, trx);
        return true;
    });
}

module.exports = {
    createAdmin,
    listAdmins,
    getPerformance,
    saveEvaluation,
    listEvaluations,
    updateAdminStatus
};
