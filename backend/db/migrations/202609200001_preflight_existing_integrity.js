async function total(knex, sql) {
    const result = await knex.raw(`SELECT COUNT(*) AS total FROM (${sql}) phase2_preflight`);
    const row = Array.isArray(result) ? result[0] : result.rows[0];
    return Number(row.total);
}

exports.up = async function up(knex) {
    const checks = [
        ['profiles without tenant', `SELECT id FROM profiles WHERE tenant_id IS NULL`],
        ['profiles with unknown tenant', `SELECT p.id FROM profiles p LEFT JOIN tenants t ON t.id=p.tenant_id WHERE p.tenant_id IS NOT NULL AND t.id IS NULL`],
        ['affiliations with orphan user', `SELECT f.id FROM filiacoes f LEFT JOIN profiles p ON p.id=f.user_id WHERE f.user_id IS NOT NULL AND p.id IS NULL`],
        ['affiliations with orphan responsible admin', `SELECT f.id FROM filiacoes f LEFT JOIN profiles p ON p.id=f.responsavel_admin_id WHERE f.responsavel_admin_id IS NOT NULL AND p.id IS NULL`],
        ['affiliations with orphan approving admin', `SELECT f.id FROM filiacoes f LEFT JOIN profiles p ON p.id=f.aprovado_por_admin_id WHERE f.aprovado_por_admin_id IS NOT NULL AND p.id IS NULL`],
        ['documents with orphan user', `SELECT d.id FROM documentos d LEFT JOIN profiles p ON p.id=d.user_id WHERE d.user_id IS NOT NULL AND p.id IS NULL`],
        ['documents with orphan affiliation', `SELECT d.id FROM documentos d LEFT JOIN filiacoes f ON f.id=d.filiacao_id WHERE d.filiacao_id IS NOT NULL AND f.id IS NULL`],
        ['conversations with orphan admin', `SELECT c.id FROM conversations c LEFT JOIN profiles p ON p.id=c.admin_id WHERE p.id IS NULL`],
        ['conversations with orphan user', `SELECT c.id FROM conversations c LEFT JOIN profiles p ON p.id=c.user_id WHERE p.id IS NULL`],
        ['messages with orphan conversation', `SELECT m.id FROM messages m LEFT JOIN conversations c ON c.id=m.conversation_id WHERE c.id IS NULL`],
        ['messages with orphan sender', `SELECT m.id FROM messages m LEFT JOIN profiles p ON p.id=m.sender_id WHERE p.id IS NULL`],
        ['affiliation chat with orphan affiliation', `SELECT c.id FROM filiation_chat c LEFT JOIN filiacoes f ON f.id=c.filiacao_id WHERE f.id IS NULL`],
        ['affiliation chat with orphan sender', `SELECT c.id FROM filiation_chat c LEFT JOIN profiles p ON p.id=c.sender_id WHERE p.id IS NULL`],
        ['evaluations with orphan admin', `SELECT e.id FROM admin_evaluations e LEFT JOIN profiles p ON p.id=e.admin_id WHERE p.id IS NULL`],
        ['evaluations with orphan evaluator', `SELECT e.id FROM admin_evaluations e LEFT JOIN profiles p ON p.id=e.evaluator_id WHERE p.id IS NULL`],
        ['audit logs with orphan actor', `SELECT a.id FROM audit_logs a LEFT JOIN profiles p ON p.id=a.admin_id WHERE a.admin_id IS NOT NULL AND p.id IS NULL`],
        ['security alerts with orphan affected user', `SELECT a.id FROM security_alerts a LEFT JOIN profiles p ON p.id=a.affected_user_id WHERE a.affected_user_id IS NOT NULL AND p.id IS NULL`],
        ['security alerts with orphan acknowledging user', `SELECT a.id FROM security_alerts a LEFT JOIN profiles p ON p.id=a.acknowledged_by WHERE a.acknowledged_by IS NOT NULL AND p.id IS NULL`],
        ['tenants with invalid technical admin', `SELECT t.id FROM tenants t LEFT JOIN profiles p ON p.id=t.technical_admin_id AND p.tenant_id=t.id WHERE t.technical_admin_id IS NOT NULL AND p.id IS NULL`]
    ];
    const problems = [];
    for (const [label, sql] of checks) {
        const count = await total(knex, sql);
        if (count > 0) problems.push(`${label}: ${count} row(s)`);
    }
    if (problems.length > 0) {
        throw new Error(`PHASE2_MANUAL_REVIEW: ${problems.join('; ')}`);
    }
};

exports.down = async function down() {};
