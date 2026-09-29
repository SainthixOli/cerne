const jwt = require('jsonwebtoken');
const express = require('express');
const request = require('supertest');
const knex = require('../src/config/connection');
const routes = require('../src/routes');
const fullApp = require('../src/app');
const storage = require('../src/services/localStorage');
const uploadGrant = require('../src/services/uploadGrant');

const app = express();
app.use(express.json());
app.use('/api', routes);

const pdf = Buffer.from('%PDF-1.4\n1 0 obj\nendobj\n%%EOF');
let tenantOne;
let tenantTwo;

const token = (id, role, tenantId) => jwt.sign({ id, role, tenantId }, process.env.JWT_SECRET);
const authorized = (call, id, role, tenantId) => call.set('Authorization', `Bearer ${token(id, role, tenantId)}`);

beforeEach(async () => {
    await knex('affiliation_upload_tokens').del();
    await knex('tenant_super_admins').del();
    await knex('messages').del();
    await knex('conversations').del();
    await knex('filiation_chat').del();
    await knex('documentos').del();
    await knex('filiacoes').del();
    await knex('profiles').del();
    await knex('tenants').del();
    [{ id: tenantOne }] = await knex('tenants').insert({ name: 'Tenant um', slug: 'tenant-um', status: 'ATIVO' }).returning('id');
    [{ id: tenantTwo }] = await knex('tenants').insert({ name: 'Tenant dois', slug: 'tenant-dois', status: 'ATIVO' }).returning('id');
    await knex('profiles').insert([
        { id: 'member-one', tenant_id: tenantOne, cpf: '30000000001', email: 'one@example.test', nome_completo: 'Membro um', role: 'professor', status_conta: 'ativo' },
        { id: 'member-other', tenant_id: tenantOne, cpf: '30000000002', email: 'other@example.test', nome_completo: 'Outro membro', role: 'professor', status_conta: 'ativo' },
        { id: 'admin-one', tenant_id: tenantOne, cpf: '30000000003', email: 'admin@example.test', nome_completo: 'Admin um', role: 'admin', status_conta: 'ativo' },
        { id: 'admin-other', tenant_id: tenantOne, cpf: '30000000004', email: 'admin2@example.test', nome_completo: 'Admin dois', role: 'admin', status_conta: 'ativo' },
        { id: 'super-one', tenant_id: tenantOne, cpf: '30000000005', email: 'super@example.test', nome_completo: 'Super', role: 'super_admin', status_conta: 'ativo' },
        { id: 'cross-admin', tenant_id: tenantTwo, cpf: '30000000006', email: 'cross@example.test', nome_completo: 'Outro tenant', role: 'admin', status_conta: 'ativo' },
        { id: 'member-two', tenant_id: tenantTwo, cpf: '30000000007', email: 'two@example.test', nome_completo: 'Membro dois', role: 'professor', status_conta: 'ativo' }
    ]);
});

afterEach(async () => {
    jest.restoreAllMocks();
    await knex('affiliation_upload_tokens').del();
    await knex('tenant_super_admins').del();
    await knex('messages').del();
    await knex('conversations').del();
    await knex('filiation_chat').del();
    await knex('documentos').del();
    await knex('filiacoes').del();
    await knex('profiles').del();
    await knex('tenants').del();
});

async function createAffiliation(ownerId = 'member-one', assigneeId = null) {
    const [{ id }] = await knex('filiacoes').insert({
        user_id: ownerId, tenant_id: tenantOne, status: 'em_processamento',
        responsavel_admin_id: assigneeId
    }).returning('id');
    return id;
}

async function createDocument(ownerId = 'member-one', affiliationId = null, storedPath = null) {
    const key = storedPath || await storage.save(pdf, 'application/pdf');
    const [{ id }] = await knex('documentos').insert({
        user_id: ownerId, filiacao_id: affiliationId, tenant_id: tenantOne,
        url_arquivo: key, tipo_documento: 'ficha_assinada'
    }).returning('id');
    return { id, key };
}

describe('private document access', () => {
    test('/uploads is not published, while owner can read by document ID', async () => {
        const { id, key } = await createDocument();
        await request(fullApp).get(`/uploads/${key}`).expect(404);
        const response = await authorized(request(app).get(`/api/documents/${id}`), 'member-one', 'professor', tenantOne).expect(200);
        expect(response.body.equals(pdf)).toBe(true);
        expect(response.headers['content-disposition']).not.toContain(key);
    });

    test('another member and cross-tenant admin cannot read; admin needs affiliation permission', async () => {
        const affiliationId = await createAffiliation('member-one', 'admin-one');
        const { id } = await createDocument('member-one', affiliationId);
        await authorized(request(app).get(`/api/documents/${id}`), 'member-other', 'professor', tenantOne).expect(403);
        await authorized(request(app).get(`/api/documents/${id}`), 'cross-admin', 'admin', tenantTwo).expect(404);
        await authorized(request(app).get(`/api/documents/${id}`), 'admin-other', 'admin', tenantOne).expect(403);
        await authorized(request(app).get(`/api/documents/${id}`), 'admin-one', 'admin', tenantOne).expect(200);
        await authorized(request(app).get(`/api/documents/${id}`), 'super-one', 'super_admin', tenantOne).expect(200);
    });

    test('path traversal, absolute paths and unsafe legacy paths fail', async () => {
        const { id } = await createDocument();
        await authorized(request(app).get('/api/documents/%2e%2e%2fsecret'), 'member-one', 'professor', tenantOne).expect(400);
        await expect(storage.resolve('../outside.pdf')).rejects.toThrow();
        await knex('documentos').where({ id }).update({ url_arquivo: '/tmp/legacy.pdf' });
        await authorized(request(app).get(`/api/documents/${id}`), 'member-one', 'professor', tenantOne).expect(404);
        await knex('documentos').where({ id }).update({ url_arquivo: '../outside.pdf' });
        await authorized(request(app).get(`/api/documents/${id}`), 'member-one', 'professor', tenantOne).expect(404);
    });
});

describe('one-use affiliation upload capability', () => {
    test('CPF alone does not authorize, expiry and reuse fail, and the token binds the affiliation', async () => {
        const affiliationId = await createAffiliation();
        const grant = await uploadGrant.issue(knex, affiliationId, tenantOne);
        await request(app).post('/api/upload').set('X-Tenant-Slug', 'tenant-um')
            .field('cpf', '30000000002').attach('file', pdf, 'form.pdf').expect(403);
        await request(app).post('/api/upload').set('X-Tenant-Slug', 'tenant-dois')
            .set('X-Upload-Token', grant).attach('file', pdf, 'form.pdf').expect(403);

        const first = await request(app).post('/api/upload').set('X-Tenant-Slug', 'tenant-um')
            .set('X-Upload-Token', grant)
            .attach('file', pdf, 'form.pdf').expect(200);
        const stored = await knex('documentos').where({ id: first.body.documentId }).first();
        expect(stored.user_id).toBe('member-one');
        expect(stored.filiacao_id).toBe(affiliationId);
        const [storageTenant, storageFilename] = stored.url_arquivo.split('/');
        expect(Number(storageTenant)).toBe(tenantOne);
        expect(storageFilename).toMatch(/^[a-f0-9]{48}\.pdf$/);
        await request(app).post('/api/upload').set('X-Tenant-Slug', 'tenant-um')
            .set('X-Upload-Token', grant).attach('file', pdf, 'form.pdf').expect(403);

        const expired = await uploadGrant.issue(knex, affiliationId, tenantOne);
        await knex('affiliation_upload_tokens').whereNull('used_at').where({ filiacao_id: affiliationId })
            .update({ expires_at: new Date('2000-01-01T00:00:00.000Z') });
        await request(app).post('/api/upload').set('X-Tenant-Slug', 'tenant-um')
            .set('X-Upload-Token', expired).attach('file', pdf, 'form.pdf').expect(403);
    });

    test('database failure removes the newly saved file', async () => {
        const affiliationId = await createAffiliation();
        const grant = await uploadGrant.issue(knex, affiliationId, tenantOne);
        const before = storage.objectCount();
        await knex.raw(`
            CREATE FUNCTION reject_test_document_fn() RETURNS trigger AS $$
            BEGIN RAISE EXCEPTION 'Synthetic database failure'; END;
            $$ LANGUAGE plpgsql;
            CREATE TRIGGER reject_test_document BEFORE INSERT ON documentos
            FOR EACH ROW EXECUTE FUNCTION reject_test_document_fn()
        `);
        try {
            await request(app).post('/api/upload').set('X-Tenant-Slug', 'tenant-um')
                .set('X-Upload-Token', grant).attach('file', pdf, 'form.pdf').expect(500);
        } finally {
            await knex.raw('DROP TRIGGER reject_test_document ON documentos');
            await knex.raw('DROP FUNCTION reject_test_document_fn()');
        }
        expect(storage.objectCount()).toBe(before);
    });
});

describe('profile and chat IDOR', () => {
    test('profile comes from validated JWT and protected fields are rejected', async () => {
        await authorized(request(app).get('/api/profile'), 'member-one', 'professor', tenantOne).expect(200);
        await authorized(request(app).put('/api/profile').send({ role: 'super_admin' }),
            'member-one', 'professor', tenantOne).expect(400);
        await authorized(request(app).put('/api/profile').send({ tenant_id: tenantTwo }),
            'member-one', 'professor', tenantOne).expect(400);
        const member = await knex('profiles').where({ id: 'member-one' }).first();
        expect(member.role).toBe('professor');
        expect(member.tenant_id).toBe(tenantOne);
    });

    test('profile photo is private and tied to the authenticated profile', async () => {
        const photo = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const key = await storage.save(photo, 'image/png');
        await knex('profiles').where({ id: 'member-one' }).update({ photo_url: key });
        await request(fullApp).get(`/uploads/${key}`).expect(404);
        await request(app).get('/api/profile/photo').expect(401);
        const own = await authorized(request(app).get('/api/profile/photo'),
            'member-one', 'professor', tenantOne).expect(200);
        expect(own.body.equals(photo)).toBe(true);
        expect(own.headers['cache-control']).toBe('private, no-store');
        await authorized(request(app).get('/api/profile/photo'),
            'member-other', 'professor', tenantOne).expect(404);
    });

    test('conversation participant can read; stranger and cross-tenant user cannot', async () => {
        await knex('conversations').insert({ id: 'chat-one', admin_id: 'admin-one', user_id: 'member-one', tenant_id: tenantOne });
        await authorized(request(app).get('/api/chat/chat-one/messages'), 'member-one', 'professor', tenantOne).expect(200);
        await authorized(request(app).get('/api/chat/chat-one/messages'), 'member-other', 'professor', tenantOne).expect(403);
        await authorized(request(app).get('/api/chat/chat-one/messages'), 'cross-admin', 'admin', tenantTwo).expect(404);
        await authorized(request(app).get('/api/chat/chat-one/messages'), 'super-one', 'super_admin', tenantOne).expect(200);
        await authorized(request(app).post('/api/chat/chat-one/messages').send({ content: 'Olá' }),
            'super-one', 'super_admin', tenantOne).expect(403);
    });

    test('starting a conversation with a user in another tenant is rejected', async () => {
        await authorized(request(app).post('/api/chat/start').send({ userId: 'cross-admin' }),
            'member-one', 'professor', tenantOne).expect(403);
    });

    test('an explicitly linked super admin retains access to tenant-scoped documents and chat', async () => {
        await knex('tenant_super_admins').insert({ user_id: 'super-one', tenant_id: tenantTwo });
        const key = await storage.save(pdf, 'application/pdf');
        const [{ id: documentId }] = await knex('documentos').insert({
            user_id: 'member-two', tenant_id: tenantTwo, url_arquivo: key, tipo_documento: 'template'
        }).returning('id');
        await authorized(request(app).get(`/api/documents/${documentId}`),
            'super-one', 'super_admin', tenantTwo).expect(200);
        await knex('conversations').insert({
            id: 'linked-chat', admin_id: 'cross-admin', user_id: 'member-two', tenant_id: tenantTwo
        });
        await authorized(request(app).get('/api/chat/linked-chat/messages'),
            'super-one', 'super_admin', tenantTwo).expect(200);
        await authorized(request(app).get('/api/chat/linked-chat/messages'),
            'member-two', 'professor', tenantTwo).expect(200);
        const available = await authorized(request(app).get('/api/chat/admins'),
            'member-two', 'professor', tenantTwo).expect(200);
        expect(available.body.some((admin) => admin.id === 'super-one')).toBe(true);
    });

    test('affiliation chat rejects CPF-only access and preserves owner/assigned-admin access', async () => {
        const affiliationId = await createAffiliation('member-one', 'admin-one');
        await request(app).get(`/api/affiliations/${affiliationId}/chat`)
            .set('X-CPF', '30000000001').expect(401);
        await authorized(request(app).get(`/api/affiliations/${affiliationId}/chat`),
            'member-other', 'professor', tenantOne).expect(403);
        await authorized(request(app).get(`/api/affiliations/${affiliationId}/chat`),
            'member-one', 'professor', tenantOne).expect(200);
        await authorized(request(app).post(`/api/affiliations/${affiliationId}/chat`).send({ message: 'Olá' }),
            'admin-one', 'admin', tenantOne).expect(200);
    });

    test('reading a rejected affiliation chat does not delete its history', async () => {
        const affiliationId = await createAffiliation();
        await knex('filiacoes').where({ id: affiliationId }).update({ status: 'rejeitado' });
        await knex('filiation_chat').insert({
            filiacao_id: affiliationId, sender_id: 'member-one', tenant_id: tenantOne,
            message: 'Mensagem histórica', created_at: '2000-01-01T00:00:00.000Z'
        });
        await authorized(request(app).get(`/api/affiliations/${affiliationId}/chat`),
            'member-one', 'professor', tenantOne).expect(200);
        expect(Number((await knex('filiation_chat').where({ filiacao_id: affiliationId })
            .count('* as total').first()).total)).toBe(1);
    });
});
