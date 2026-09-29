const STANDARD_TABLES = [
    'filiacoes', 'documentos', 'conversations', 'messages', 'filiation_chat',
    'notifications', 'admin_evaluations', 'system_settings', 'audit_logs',
    'security_alerts', 'affiliation_upload_tokens', 'tenant_super_admins'
];

const tenantExpression = `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::integer`;
const globalExpression = `
    current_user = 'cerne_global'
    AND NULLIF(current_setting('app.global_actor_id', true), '') IS NOT NULL
    AND NULLIF(current_setting('app.global_reason', true), '') IS NOT NULL
`;

async function addPolicies(knex, table, expression = tenantExpression) {
    await knex.raw('ALTER TABLE ?? ENABLE ROW LEVEL SECURITY', [table]);
    await knex.raw('ALTER TABLE ?? FORCE ROW LEVEL SECURITY', [table]);
    await knex.raw(`CREATE POLICY tenant_isolation ON ?? USING (${expression}) WITH CHECK (${expression})`, [table]);
    await knex.raw(`CREATE POLICY audited_global_access ON ?? USING (${globalExpression}) WITH CHECK (${globalExpression})`, [table]);
}

exports.up = async function (knex) {
    await addPolicies(knex, 'profiles', `
        ${tenantExpression}
        OR (
            role = 'super_admin'
            AND EXISTS (
                SELECT 1 FROM tenant_super_admins link
                WHERE link.user_id = profiles.id
                  AND link.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::integer
            )
        )
    `);
    for (const table of STANDARD_TABLES) await addPolicies(knex, table);
};

exports.down = async function (knex) {
    for (const table of ['profiles', ...STANDARD_TABLES]) {
        await knex.raw('DROP POLICY IF EXISTS audited_global_access ON ??', [table]);
        await knex.raw('DROP POLICY IF EXISTS tenant_isolation ON ??', [table]);
        await knex.raw('ALTER TABLE ?? NO FORCE ROW LEVEL SECURITY', [table]);
        await knex.raw('ALTER TABLE ?? DISABLE ROW LEVEL SECURITY', [table]);
    }
};
