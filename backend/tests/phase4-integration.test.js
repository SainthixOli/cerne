const request = require('supertest');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const app = require('../src/app');
const knex = require('../src/config/connection');

describe('multi-tenant integration', () => {
    let tenantOne;
    let tenantTwo;
    let tenantOneAdmin;
    let tenantTwoAdmin;
    let tenantOneToken;

    beforeEach(async () => {
        await knex('affiliation_upload_tokens').del();
        await knex('messages').del();
        await knex('conversations').del();
        await knex('filiation_chat').del();
        await knex('documentos').del();
        await knex('notifications').del();
        await knex('audit_logs').del();
        await knex('filiacoes').del();
        await knex('tenant_super_admins').del();
        await knex('profiles').del();
        await knex('tenants').del();

        [{ id: tenantOne }] = await knex('tenants').insert({ name: 'Tenant 1', slug: 'phase4-one', status: 'ATIVO' }).returning('id');
        [{ id: tenantTwo }] = await knex('tenants').insert({ name: 'Tenant 2', slug: 'phase4-two', status: 'ATIVO' }).returning('id');
        tenantOneAdmin = uuidv4();
        tenantTwoAdmin = uuidv4();
        await knex('profiles').insert([
            { id: tenantOneAdmin, nome_completo: 'Admin Tenant 1', cpf: '11111111111', email: 'admin1@example.test', role: 'super_admin', status_conta: 'ativo', tenant_id: tenantOne },
            { id: tenantTwoAdmin, nome_completo: 'Admin Tenant 2', cpf: '22222222222', email: 'admin2@example.test', role: 'admin', status_conta: 'ativo', tenant_id: tenantTwo }
        ]);
        tenantOneToken = jwt.sign({ id: tenantOneAdmin, role: 'super_admin', tenantId: tenantOne }, process.env.JWT_SECRET);
    });

    const auth = (call) => call.set('Authorization', `Bearer ${tenantOneToken}`);

    test('tenant 1 does not list administrators from tenant 2', async () => {
        const response = await auth(request(app).get('/api/admin/users')).expect(200);
        expect(response.body.map((profile) => profile.id)).not.toContain(tenantTwoAdmin);
    });

    test('tenant 1 does not receive tenant 2 audit logs', async () => {
        await knex('audit_logs').insert({ admin_id: tenantTwoAdmin, action_type: 'UPDATE_PROFILE', target_id: 'target-two', details: '{}', tenant_id: tenantTwo });
        const response = await auth(request(app).get('/api/admin/audit')).expect(200);
        expect(response.body.map((log) => log.target_id)).not.toContain('target-two');
    });

    test('tenant 1 cannot update an administrator from tenant 2', async () => {
        await auth(request(app).put(`/api/admin/users/${tenantTwoAdmin}/status`).send({ status: 'inativo' })).expect(403);
        expect((await knex('profiles').where({ id: tenantTwoAdmin }).first()).status_conta).toBe('ativo');
    });

    test('an unavailable cross-tenant mutation cannot delete an affiliation', async () => {
        const member = uuidv4();
        await knex('profiles').insert({ id: member, nome_completo: 'Member 2', cpf: '33333333333', email: 'member2@example.test', role: 'professor', status_conta: 'ativo', tenant_id: tenantTwo });
        const [{ id: affiliationId }] = await knex('filiacoes').insert({ user_id: member, status: 'em_processamento', tenant_id: tenantTwo }).returning('id');
        await auth(request(app).delete(`/api/affiliations/${affiliationId}`)).expect(404);
        expect(await knex('filiacoes').where({ id: affiliationId, tenant_id: tenantTwo }).first()).toBeDefined();
    });

    test('created audit logs retain the authoritative tenant', async () => {
        await auth(request(app).post('/api/admin/users').send({
            nome: 'New Admin', cpf: '44444444444', email: 'new.admin@example.com', password: 'StrongAdmin1!Pass'
        })).expect(201);
        const audit = await knex('audit_logs').where({ admin_id: tenantOneAdmin }).orderBy('created_at', 'desc').first();
        expect(audit).toBeDefined();
        expect(audit.tenant_id).toBe(tenantOne);
    });

    test('tenant 2 notifications are absent from tenant 1', async () => {
        const notificationId = uuidv4();
        await knex('notifications').insert({ id: notificationId, title: 'Tenant 2', message: 'Only tenant 2', target_group: 'all', status: 'approved', created_by: tenantTwoAdmin, tenant_id: tenantTwo });
        const response = await auth(request(app).get('/api/notifications/my')).expect(200);
        expect(response.body.map((notification) => notification.id)).not.toContain(notificationId);
    });

    test('tenant 1 cannot retrieve a tenant 2 document', async () => {
        const member = uuidv4();
        await knex('profiles').insert({ id: member, nome_completo: 'Document Owner', cpf: '55555555555', email: 'doc@example.test', role: 'professor', status_conta: 'ativo', tenant_id: tenantTwo });
        const [{ id: documentId }] = await knex('documentos').insert({ user_id: member, url_arquivo: 'missing.pdf', tipo_documento: 'outro', tenant_id: tenantTwo }).returning('id');
        await auth(request(app).get(`/api/documents/${documentId}`)).expect(404);
    });

    test('tenant-filtered affiliation query remains responsive', async () => {
        const startedAt = Date.now();
        await auth(request(app).get('/api/affiliations')).expect(200);
        expect(Date.now() - startedAt).toBeLessThan(1000);
    });

    test.each(['filiacoes', 'documentos', 'audit_logs'])('%s has no tenant-less records', async (table) => {
        const result = await knex(table).whereNull('tenant_id').count('* as count').first();
        expect(Number(result.count)).toBe(0);
    });
});
