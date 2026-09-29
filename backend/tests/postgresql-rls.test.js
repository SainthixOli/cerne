const knex = require('../src/config/connection');

const role = `cerne_rls_test_${process.pid}`;
let tenantOne;
let tenantTwo;

async function asApplicationRole(tenantId, callback) {
    return knex.rootConnection.transaction(async (trx) => {
        await trx.raw('SET LOCAL ROLE ??', [role]);
        if (tenantId) await trx.raw("SELECT set_config('app.tenant_id', ?, true)", [String(tenantId)]);
        return callback(trx);
    });
}

async function dropTestRole() {
    await knex.raw('DROP OWNED BY ??', [role]);
    await knex.raw('DROP ROLE IF EXISTS ??', [role]);
}

beforeAll(async () => {
    const existing = await knex.raw('SELECT 1 FROM pg_roles WHERE rolname = ?', [role]);
    if (existing.rows.length) await dropTestRole();
    await knex.raw('CREATE ROLE ?? NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS', [role]);
    await knex.raw('GRANT USAGE ON SCHEMA public TO ??', [role]);
    await knex.raw('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ??', [role]);
    await knex.raw('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ??', [role]);
});

beforeEach(async () => {
    await knex('tenants').whereIn('slug', ['rls-one', 'rls-two']).del();
    [{ id: tenantOne }] = await knex('tenants').insert({ name: 'RLS One', slug: 'rls-one' }).returning('id');
    [{ id: tenantTwo }] = await knex('tenants').insert({ name: 'RLS Two', slug: 'rls-two' }).returning('id');
    await knex('profiles').insert([
        { id: 'rls-user-one', tenant_id: tenantOne, nome_completo: 'One', cpf: '93000000001' },
        { id: 'rls-user-two', tenant_id: tenantTwo, nome_completo: 'Two', cpf: '93000000002' }
    ]);
});

test('RLS isolates a query that accidentally omits the tenant predicate', async () => {
    const rows = await asApplicationRole(tenantOne, (trx) => trx('profiles').select('id').orderBy('id'));
    expect(rows).toEqual([{ id: 'rls-user-one' }]);

    await expect(asApplicationRole(tenantOne, (trx) => trx('profiles').insert({
        id: 'rls-cross-write', tenant_id: tenantTwo, nome_completo: 'Cross', cpf: '93000000003'
    }))).rejects.toThrow();
});

test('SET LOCAL tenant context does not leak when the pool reuses a connection', async () => {
    try {
        await asApplicationRole(tenantOne, async (trx) => {
            const setting = await trx.raw("SELECT current_setting('app.tenant_id', true) AS tenant_id");
            expect(setting.rows[0].tenant_id).toBe(String(tenantOne));
        });

        await asApplicationRole(null, async (trx) => {
            const setting = await trx.raw("SELECT current_setting('app.tenant_id', true) AS tenant_id");
            expect(setting.rows[0].tenant_id || null).toBeNull();
            expect(await trx('profiles').select('id')).toEqual([]);
        });
    } finally {
        await dropTestRole();
    }
});
