const path = require('path');
const knexFactory = require('knex');
const baseConfig = require('../knexfile').test;

const migrationDirectory = path.resolve(__dirname, '../db/migrations');

async function makeDatabase() {
    const schema = `integrity_${process.pid}_${Date.now()}`;
    const root = knexFactory(baseConfig);
    await root.raw('CREATE SCHEMA ??', [schema]);
    const db = knexFactory({
        ...baseConfig,
        searchPath: [schema],
        migrations: { directory: migrationDirectory, tableName: 'knex_migrations' }
    });
    return { db, root, schema };
}

async function schemaSnapshot(db) {
    const tableRows = await db.raw(`
        SELECT table_name AS name
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name NOT IN ('knex_migrations', 'knex_migrations_lock')
        ORDER BY table_name
    `);
    const names = tableRows.rows.map((row) => row.name);
    const tables = {};
    for (const name of names) {
        const constraints = await db.raw(`
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_schema = current_schema() AND table_name = ?
            ORDER BY constraint_name
        `, [name]);
        tables[name] = {
            columns: await db(name).columnInfo(),
            constraints: constraints.rows.filter(({ constraint_name }) => !constraint_name.endsWith('_not_null'))
        };
    }
    return tables;
}

describe('Phase 2 database integrity', () => {
    let db;
    let root;
    let schema;

    beforeAll(async () => {
        ({ db, root, schema } = await makeDatabase());
        await db.migrate.latest();
    });

    afterAll(async () => {
        await db.destroy();
        await root.raw('DROP SCHEMA ?? CASCADE', [schema]);
        await root.destroy();
    });

    test('empty migrate, complete rollback and remigrate are deterministic', async () => {
        const first = await schemaSnapshot(db);
        await db.migrate.rollback(undefined, true);
        expect(await db.schema.hasTable('profiles')).toBe(false);

        await db.migrate.latest();
        const second = await schemaSnapshot(db);
        expect(second).toEqual(first);
    });

    test('all tenant-scoped entities require a tenant', async () => {
        const tables = [
            'profiles', 'filiacoes', 'documentos', 'conversations', 'messages',
            'filiation_chat', 'notifications', 'admin_evaluations', 'system_settings',
            'audit_logs', 'security_alerts', 'affiliation_upload_tokens'
        ];
        for (const table of tables) {
            expect((await db(table).columnInfo()).tenant_id.nullable).toBe(false);
        }
    });

    test('cross-tenant relationships are rejected by the database', async () => {
        const [{ id: tenantOne }] = await db('tenants').insert({ name: 'Tenant One', slug: 'phase2-one' }).returning('id');
        const [{ id: tenantTwo }] = await db('tenants').insert({ name: 'Tenant Two', slug: 'phase2-two' }).returning('id');
        await db('profiles').insert([
            { id: 'p2-user-one', tenant_id: tenantOne, nome_completo: 'User One', cpf: '91000000001', role: 'professor', status_conta: 'ativo' },
            { id: 'p2-admin-one', tenant_id: tenantOne, nome_completo: 'Admin One', cpf: '91000000002', role: 'admin', status_conta: 'ativo' },
            { id: 'p2-user-two', tenant_id: tenantTwo, nome_completo: 'User Two', cpf: '91000000001', role: 'professor', status_conta: 'ativo' },
            { id: 'p2-admin-two', tenant_id: tenantTwo, nome_completo: 'Admin Two', cpf: '91000000002', role: 'admin', status_conta: 'ativo' },
            { id: 'p2-system-one', tenant_id: tenantOne, nome_completo: 'System One', cpf: '91000000003', role: 'system_manager', status_conta: 'ativo' },
            { id: 'p2-system-two', tenant_id: tenantTwo, nome_completo: 'System Two', cpf: '91000000003', role: 'system_manager', status_conta: 'ativo' }
        ]);

        await expect(db('filiacoes').insert({
            tenant_id: tenantOne, user_id: 'p2-user-two', protocolo: 'CROSS-USER', status: 'em_processamento'
        })).rejects.toThrow();

        const [{ id: affiliationId }] = await db('filiacoes').insert({
            tenant_id: tenantOne, user_id: 'p2-user-one', protocolo: 'VALID-ONE', status: 'em_processamento'
        }).returning('id');
        await expect(db('documentos').insert({
            tenant_id: tenantTwo,
            user_id: 'p2-user-two',
            filiacao_id: affiliationId,
            url_arquivo: 'test.pdf',
            tipo_documento: 'ficha_assinada'
        })).rejects.toThrow();

        await expect(db('security_alerts').insert({
            tenant_id: tenantOne, alert_type: 'TEST', severity: 'high', affected_user_id: 'p2-user-two'
        })).rejects.toThrow();
        await expect(db('security_alerts').insert({
            tenant_id: tenantOne, alert_type: 'TEST', severity: 'high',
            affected_user_id: 'p2-user-one', acknowledged_by: 'p2-admin-two'
        })).rejects.toThrow();

        await expect(db('tenants').where({ id: tenantOne })
            .update({ technical_admin_id: 'p2-system-two' })).rejects.toThrow();
        await db('tenants').where({ id: tenantOne }).update({ technical_admin_id: 'p2-system-one' });
        await expect(db('profiles').where({ id: 'p2-system-one' }).update({ role: 'admin' })).rejects.toThrow();
    });

    test('identity and protocol uniqueness are scoped to the tenant', async () => {
        const tenants = await db('tenants').whereIn('slug', ['phase2-one', 'phase2-two']).orderBy('id');
        await db('filiacoes').insert({
            tenant_id: tenants[1].id, user_id: 'p2-user-two', protocolo: 'VALID-ONE', status: 'em_processamento'
        });
        await expect(db('filiacoes').insert({
            tenant_id: tenants[0].id, user_id: 'p2-user-one', protocolo: 'VALID-ONE', status: 'em_processamento'
        })).rejects.toThrow();
    });

    test('administrative evaluation constraints reject invalid and duplicate records', async () => {
        const tenant = await db('tenants').where({ slug: 'phase2-one' }).first();
        const evaluation = {
            tenant_id: tenant.id,
            admin_id: 'p2-admin-one',
            evaluator_id: 'p2-admin-one',
            month_ref: '2026-09',
            score: 5
        };
        await db('admin_evaluations').insert(evaluation);
        await db('admin_evaluations').insert({ ...evaluation, score: 4 })
            .onConflict(['tenant_id', 'admin_id', 'month_ref']).merge(['score']);
        expect(await db('admin_evaluations').where({
            tenant_id: tenant.id, admin_id: 'p2-admin-one', month_ref: '2026-09'
        }).first()).toMatchObject({ score: 4 });
        await expect(db('admin_evaluations').insert(evaluation)).rejects.toThrow();
        await expect(db('admin_evaluations').insert({ ...evaluation, month_ref: '2026-10', score: 6 }))
            .rejects.toThrow();
        await expect(db('admin_evaluations').insert({ ...evaluation, month_ref: '2026-13', score: 4 }))
            .rejects.toThrow();
    });

    test('role and status values are constrained', async () => {
        const tenant = await db('tenants').where({ slug: 'phase2-one' }).first();
        await expect(db('profiles').insert({
            id: 'invalid-role', tenant_id: tenant.id, nome_completo: 'Invalid', cpf: '91999999999',
            role: 'owner', status_conta: 'ativo'
        })).rejects.toThrow();
        await expect(db('filiacoes').insert({
            tenant_id: tenant.id, user_id: 'p2-user-one', protocolo: 'INVALID-STATUS', status: 'unknown'
        })).rejects.toThrow();
    });
});
