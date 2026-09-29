const TENANT_SCOPED_TABLES = [
    'profiles', 'filiacoes', 'documentos', 'conversations', 'messages',
    'filiation_chat', 'notifications', 'admin_evaluations', 'audit_logs'
];

exports.seed = async (knex) => {
    const ambiguous = [];
    for (const table of TENANT_SCOPED_TABLES) {
        const row = await knex(table).whereNull('tenant_id').count({ total: '*' }).first();
        if (Number(row.total) > 0) ambiguous.push(`${table}: ${row.total}`);
    }
    if (ambiguous.length > 0) {
        throw new Error(`Manual tenant assignment required before seeding: ${ambiguous.join(', ')}`);
    }

    let tenant = await knex('tenants').where({ slug: 'sindicato-principal' }).first();
    if (!tenant) {
        const inserted = await knex('tenants').insert({
            name: 'Sindicato Principal',
            slug: 'sindicato-principal',
            status: 'ATIVO',
            plan: 'professional',
            storage_used_gb: 0,
            users_count: 0
        }, ['id']);
        const id = typeof inserted[0] === 'object' ? inserted[0].id : inserted[0];
        tenant = { id };
    }

    await knex('system_settings').insert({
        tenant_id: tenant.id,
        key: 'affiliation_terms',
        value: 'Eu, {{NOME}}, solicito minha filiação e declaro ciência das normas aplicáveis.'
    }).onConflict(['tenant_id', 'key']).ignore();

    const superAdmin = await knex('profiles')
        .where({ role: 'super_admin', tenant_id: tenant.id }).first();
    if (superAdmin) {
        await knex('tenant_super_admins').insert({
            tenant_id: tenant.id,
            user_id: superAdmin.id
        }).onConflict(['tenant_id', 'user_id']).ignore();
    }
};
