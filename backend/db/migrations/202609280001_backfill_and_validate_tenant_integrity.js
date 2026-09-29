const TENANT_TABLES = [
    'profiles',
    'filiacoes',
    'documentos',
    'conversations',
    'messages',
    'filiation_chat',
    'notifications',
    'admin_evaluations',
    'system_settings',
    'audit_logs',
    'security_alerts',
    'affiliation_upload_tokens'
];

async function count(knex, table, predicate = {}) {
    const row = await knex(table).where(predicate).count({ total: '*' }).first();
    return Number(row.total);
}

async function countRaw(knex, sql) {
    const result = await knex.raw(sql);
    const row = Array.isArray(result) ? result[0] : result.rows[0];
    return Number(row.total);
}

async function tenantOf(knex, table, predicate) {
    const row = await knex(table).select('tenant_id').where(predicate).first();
    return row?.tenant_id ?? null;
}

async function prepareBackfill(knex, table, key, resolveTenant) {
    const rows = await knex(table).whereNull('tenant_id');
    const updates = [];
    let ambiguous = 0;

    for (const row of rows) {
        const candidates = (await resolveTenant(row)).filter((value) => value !== null && value !== undefined);
        const unique = [...new Set(candidates.map(Number))];
        if (unique.length !== 1) {
            ambiguous += 1;
        } else {
            updates.push({ id: row[key], tenantId: unique[0] });
        }
    }

    if (ambiguous > 0) {
        throw new Error(`PHASE2_MANUAL_REVIEW: ${table} contains ${ambiguous} row(s) without one authoritative tenant`);
    }
    return { table, key, updates };
}

async function validateNoRows(knex, label, sql) {
    const total = await countRaw(knex, `SELECT COUNT(*) AS total FROM (${sql}) phase2_check`);
    if (total > 0) throw new Error(`PHASE2_MANUAL_REVIEW: ${label}: ${total} row(s)`);
}

exports.up = async function up(knex) {
    const profileTenantNull = await count(knex, 'profiles', { tenant_id: null });
    if (profileTenantNull > 0) {
        throw new Error(`PHASE2_MANUAL_REVIEW: profiles contains ${profileTenantNull} row(s) without an authoritative tenant`);
    }

    await validateNoRows(knex, 'profiles references an unknown tenant', `
        SELECT p.id FROM profiles p
        LEFT JOIN tenants t ON t.id = p.tenant_id
        WHERE t.id IS NULL
    `);

    const settingsWithoutTenant = await count(knex, 'system_settings', { tenant_id: null });
    if (settingsWithoutTenant > 0) {
        const tenantCount = await count(knex, 'tenants');
        const profileCount = await count(knex, 'profiles');
        if (tenantCount === 1) {
            const tenant = await knex('tenants').select('id').first();
            await knex('system_settings').whereNull('tenant_id').update({ tenant_id: tenant.id });
        } else if (tenantCount === 0 && profileCount === 0) {
            // The original migration seeds a global template before tenants exist. In a new,
            // otherwise empty database there is no tenant-owned record to preserve.
            await knex('system_settings').whereNull('tenant_id').delete();
        } else {
            throw new Error(`PHASE2_MANUAL_REVIEW: system_settings contains ${settingsWithoutTenant} global row(s) for ${tenantCount} tenants`);
        }
    }

    const plans = [];
    plans.push(await prepareBackfill(knex, 'filiacoes', 'id', async (row) => [
        await tenantOf(knex, 'profiles', { id: row.user_id })
    ]));
    plans.push(await prepareBackfill(knex, 'documentos', 'id', async (row) => [
        await tenantOf(knex, 'profiles', { id: row.user_id }),
        await tenantOf(knex, 'filiacoes', { id: row.filiacao_id })
    ]));
    plans.push(await prepareBackfill(knex, 'conversations', 'id', async (row) => [
        await tenantOf(knex, 'profiles', { id: row.admin_id }),
        await tenantOf(knex, 'profiles', { id: row.user_id })
    ]));
    plans.push(await prepareBackfill(knex, 'messages', 'id', async (row) => [
        await tenantOf(knex, 'conversations', { id: row.conversation_id }),
        await tenantOf(knex, 'profiles', { id: row.sender_id })
    ]));
    plans.push(await prepareBackfill(knex, 'filiation_chat', 'id', async (row) => [
        await tenantOf(knex, 'filiacoes', { id: row.filiacao_id }),
        await tenantOf(knex, 'profiles', { id: row.sender_id })
    ]));
    plans.push(await prepareBackfill(knex, 'notifications', 'id', async (row) => [
        await tenantOf(knex, 'profiles', { id: row.created_by }),
        row.approved_by ? await tenantOf(knex, 'profiles', { id: row.approved_by }) : null
    ]));
    plans.push(await prepareBackfill(knex, 'admin_evaluations', 'id', async (row) => [
        await tenantOf(knex, 'profiles', { id: row.admin_id }),
        await tenantOf(knex, 'profiles', { id: row.evaluator_id })
    ]));
    plans.push(await prepareBackfill(knex, 'audit_logs', 'id', async (row) => [
        row.admin_id ? await tenantOf(knex, 'profiles', { id: row.admin_id }) : null
    ]));
    plans.push(await prepareBackfill(knex, 'security_alerts', 'id', async (row) => [
        row.affected_user_id ? await tenantOf(knex, 'profiles', { id: row.affected_user_id }) : null,
        row.acknowledged_by ? await tenantOf(knex, 'profiles', { id: row.acknowledged_by }) : null
    ]));
    plans.push(await prepareBackfill(knex, 'affiliation_upload_tokens', 'token_hash', async (row) => [
        await tenantOf(knex, 'filiacoes', { id: row.filiacao_id })
    ]));

    for (const plan of plans) {
        for (const update of plan.updates) {
            await knex(plan.table).where(plan.key, update.id).update({ tenant_id: update.tenantId });
        }
    }

    for (const table of TENANT_TABLES) {
        const nulls = await count(knex, table, { tenant_id: null });
        if (nulls > 0) throw new Error(`PHASE2_MANUAL_REVIEW: ${table}.tenant_id is null in ${nulls} row(s)`);
        await validateNoRows(knex, `${table} references an unknown tenant`, `
            SELECT scoped.tenant_id FROM ${table} scoped
            LEFT JOIN tenants t ON t.id = scoped.tenant_id
            WHERE t.id IS NULL
        `);
    }

    const relationshipChecks = [
        ['filiacoes.user_id is orphaned or cross-tenant', `SELECT f.id FROM filiacoes f LEFT JOIN profiles p ON p.id=f.user_id AND p.tenant_id=f.tenant_id WHERE p.id IS NULL`],
        ['filiacoes.responsavel_admin_id is orphaned or cross-tenant', `SELECT f.id FROM filiacoes f LEFT JOIN profiles p ON p.id=f.responsavel_admin_id AND p.tenant_id=f.tenant_id WHERE f.responsavel_admin_id IS NOT NULL AND p.id IS NULL`],
        ['filiacoes.aprovado_por_admin_id is orphaned or cross-tenant', `SELECT f.id FROM filiacoes f LEFT JOIN profiles p ON p.id=f.aprovado_por_admin_id AND p.tenant_id=f.tenant_id WHERE f.aprovado_por_admin_id IS NOT NULL AND p.id IS NULL`],
        ['documentos.user_id is orphaned or cross-tenant', `SELECT d.id FROM documentos d LEFT JOIN profiles p ON p.id=d.user_id AND p.tenant_id=d.tenant_id WHERE p.id IS NULL`],
        ['documentos.filiacao_id is orphaned or cross-tenant', `SELECT d.id FROM documentos d LEFT JOIN filiacoes f ON f.id=d.filiacao_id AND f.tenant_id=d.tenant_id WHERE d.filiacao_id IS NOT NULL AND f.id IS NULL`],
        ['conversations.admin_id is orphaned or cross-tenant', `SELECT c.id FROM conversations c LEFT JOIN profiles p ON p.id=c.admin_id AND p.tenant_id=c.tenant_id WHERE p.id IS NULL`],
        ['conversations.user_id is orphaned or cross-tenant', `SELECT c.id FROM conversations c LEFT JOIN profiles p ON p.id=c.user_id AND p.tenant_id=c.tenant_id WHERE p.id IS NULL`],
        ['messages.conversation_id is orphaned or cross-tenant', `SELECT m.id FROM messages m LEFT JOIN conversations c ON c.id=m.conversation_id AND c.tenant_id=m.tenant_id WHERE c.id IS NULL`],
        ['messages.sender_id is orphaned or cross-tenant', `SELECT m.id FROM messages m LEFT JOIN profiles p ON p.id=m.sender_id AND p.tenant_id=m.tenant_id WHERE p.id IS NULL`],
        ['filiation_chat.filiacao_id is orphaned or cross-tenant', `SELECT c.id FROM filiation_chat c LEFT JOIN filiacoes f ON f.id=c.filiacao_id AND f.tenant_id=c.tenant_id WHERE f.id IS NULL`],
        ['filiation_chat.sender_id is orphaned or cross-tenant', `SELECT c.id FROM filiation_chat c LEFT JOIN profiles p ON p.id=c.sender_id AND p.tenant_id=c.tenant_id WHERE p.id IS NULL`],
        ['notifications.created_by is orphaned or cross-tenant', `SELECT n.id FROM notifications n LEFT JOIN profiles p ON p.id=n.created_by AND p.tenant_id=n.tenant_id WHERE p.id IS NULL`],
        ['notifications.approved_by is orphaned or cross-tenant', `SELECT n.id FROM notifications n LEFT JOIN profiles p ON p.id=n.approved_by AND p.tenant_id=n.tenant_id WHERE n.approved_by IS NOT NULL AND p.id IS NULL`],
        ['admin_evaluations.admin_id is orphaned or cross-tenant', `SELECT e.id FROM admin_evaluations e LEFT JOIN profiles p ON p.id=e.admin_id AND p.tenant_id=e.tenant_id WHERE p.id IS NULL`],
        ['admin_evaluations.evaluator_id is orphaned or cross-tenant', `SELECT e.id FROM admin_evaluations e LEFT JOIN profiles p ON p.id=e.evaluator_id AND p.tenant_id=e.tenant_id WHERE p.id IS NULL`],
        ['audit_logs.admin_id is orphaned or cross-tenant', `SELECT a.id FROM audit_logs a LEFT JOIN profiles p ON p.id=a.admin_id AND p.tenant_id=a.tenant_id WHERE a.admin_id IS NOT NULL AND p.id IS NULL`],
        ['security_alerts.affected_user_id is orphaned or cross-tenant', `SELECT a.id FROM security_alerts a LEFT JOIN profiles p ON p.id=a.affected_user_id AND p.tenant_id=a.tenant_id WHERE a.affected_user_id IS NOT NULL AND p.id IS NULL`],
        ['security_alerts.acknowledged_by is orphaned or cross-tenant', `SELECT a.id FROM security_alerts a LEFT JOIN profiles p ON p.id=a.acknowledged_by AND p.tenant_id=a.tenant_id WHERE a.acknowledged_by IS NOT NULL AND p.id IS NULL`],
        ['tenants.technical_admin_id is orphaned or cross-tenant', `SELECT t.id FROM tenants t LEFT JOIN profiles p ON p.id=t.technical_admin_id AND p.tenant_id=t.id WHERE t.technical_admin_id IS NOT NULL AND p.id IS NULL`],
        ['affiliation_upload_tokens.filiacao_id is orphaned or cross-tenant', `SELECT u.token_hash FROM affiliation_upload_tokens u LEFT JOIN filiacoes f ON f.id=u.filiacao_id AND f.tenant_id=u.tenant_id WHERE f.id IS NULL`]
    ];
    const relationshipProblems = [];
    for (const [label, sql] of relationshipChecks) {
        const total = await countRaw(knex, `SELECT COUNT(*) AS total FROM (${sql}) phase2_check`);
        if (total > 0) relationshipProblems.push(`${label}: ${total} row(s)`);
    }
    if (relationshipProblems.length > 0) {
        throw new Error(`PHASE2_MANUAL_REVIEW: ${relationshipProblems.join('; ')}`);
    }

    await validateNoRows(knex, 'invalid profile role', `SELECT id FROM profiles WHERE role NOT IN ('professor','admin','super_admin','system_manager')`);
    await validateNoRows(knex, 'invalid profile status', `SELECT id FROM profiles WHERE status_conta NOT IN ('pendente_docs','em_analise','ativo','inativo')`);
    await validateNoRows(knex, 'invalid affiliation status', `SELECT id FROM filiacoes WHERE status NOT IN ('em_processamento','concluido','rejeitado','solicitando_desfiliacao','desfiliado','solicitando_reativacao')`);
    await validateNoRows(knex, 'empty affiliation protocol', `SELECT id FROM filiacoes WHERE protocolo = ''`);
    await validateNoRows(knex, 'duplicate CPF inside a tenant', `SELECT tenant_id,cpf FROM profiles GROUP BY tenant_id,cpf HAVING COUNT(*) > 1`);
    await validateNoRows(knex, 'duplicate email inside a tenant', `SELECT tenant_id,email FROM profiles WHERE email IS NOT NULL GROUP BY tenant_id,email HAVING COUNT(*) > 1`);
    await validateNoRows(knex, 'duplicate protocol inside a tenant', `SELECT tenant_id,protocolo FROM filiacoes GROUP BY tenant_id,protocolo HAVING COUNT(*) > 1`);
    await validateNoRows(knex, 'duplicate admin evaluation inside a tenant/month', `SELECT tenant_id,admin_id,month_ref FROM admin_evaluations GROUP BY tenant_id,admin_id,month_ref HAVING COUNT(*) > 1`);
    await validateNoRows(knex, 'invalid evaluation score', `SELECT id FROM admin_evaluations WHERE score IS NOT NULL AND (score < 1 OR score > 5)`);
};

// Backfilled tenant identifiers remain authoritative data on rollback. The schema migration
// that follows restores nullable columns; this migration intentionally does not reintroduce
// ambiguous/null ownership.
exports.down = async function down() {};
