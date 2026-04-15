const request = require('supertest');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const knex = require('../src/config/connection');

describe('Affiliation Flow Endpoints', () => {
    const uploadsDir = path.resolve(__dirname, '../uploads');
    const sampleFilename = 'test-private-doc.txt';
    const sampleFilePath = path.join(uploadsDir, sampleFilename);

    const userId = 'aff-user-1';
    const otherUserId = 'aff-user-2';
    const adminId = 'aff-admin-1';
    const superAdminId = 'aff-super-admin-1';
    const userCpf = '12345678910';

    let userToken;
    let otherUserToken;
    let adminToken;
    let superAdminToken;

    beforeAll(async () => {
        await knex.migrate.latest();

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(sampleFilePath, 'private test file');
    });

    afterAll(async () => {
        if (fs.existsSync(sampleFilePath)) {
            fs.unlinkSync(sampleFilePath);
        }
    });

    beforeEach(async () => {
        await knex('filiation_chat').del();
        await knex('documentos').del();
        await knex('filiacoes').del();
        await knex('profiles').del();

        await knex('profiles').insert([
            {
                id: userId,
                nome_completo: 'User One',
                cpf: userCpf,
                email: 'user1@example.com',
                status_conta: 'pendente_docs',
                role: 'professor'
            },
            {
                id: otherUserId,
                nome_completo: 'User Two',
                cpf: '98765432100',
                email: 'user2@example.com',
                status_conta: 'ativo',
                role: 'professor'
            },
            {
                id: adminId,
                nome_completo: 'Admin One',
                cpf: '11122233344',
                email: 'admin@example.com',
                status_conta: 'ativo',
                role: 'admin'
            },
            {
                id: superAdminId,
                nome_completo: 'Super Admin',
                cpf: '55566677788',
                email: 'superadmin@example.com',
                status_conta: 'ativo',
                role: 'super_admin'
            }
        ]);

        userToken = jwt.sign({ id: userId, role: 'professor', nome: 'User One' }, process.env.JWT_SECRET);
        otherUserToken = jwt.sign({ id: otherUserId, role: 'professor', nome: 'User Two' }, process.env.JWT_SECRET);
        adminToken = jwt.sign({ id: adminId, role: 'admin', nome: 'Admin One' }, process.env.JWT_SECRET);
        superAdminToken = jwt.sign({ id: superAdminId, role: 'super_admin', nome: 'Super Admin' }, process.env.JWT_SECRET);
    });

    it('register should create affiliation and return PDF', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({
                nome: 'User One',
                cpf: userCpf,
                email: 'user1@example.com',
                telefone: '11999999999',
                matricula: 'A123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('application/pdf');

        const filiacao = await knex('filiacoes').where({ user_id: userId }).first();
        expect(filiacao).toBeTruthy();
        expect(filiacao.status).toBe('em_processamento');
        expect(filiacao.protocolo).toBeTruthy();
    });

    it('upload should store signed form and update profile status', async () => {
        await knex('filiacoes').insert({
            user_id: userId,
            status: 'em_processamento',
            protocolo: '#PROTO123',
            status_atendimento: 'aberto'
        });

        const res = await request(app)
            .post('/api/upload')
            .field('cpf', userCpf)
            .attach('file', Buffer.from('signed form content'), 'signed-form.pdf');

        expect(res.statusCode).toBe(200);

        const profile = await knex('profiles').where({ id: userId }).first();
        expect(profile.status_conta).toBe('em_analise');

        const documento = await knex('documentos').where({ user_id: userId }).first();
        expect(documento).toBeTruthy();
        expect(documento.tipo_documento).toBe('ficha_assinada');
    });

    it('approve should conclude affiliation and not expose temp password', async () => {
        const [filiacaoId] = await knex('filiacoes').insert({
            user_id: userId,
            status: 'em_processamento',
            protocolo: '#APR12345',
            status_atendimento: 'aberto'
        });

        const res = await request(app)
            .post(`/api/affiliations/${filiacaoId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ observacoes: 'Aprovado no teste' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Affiliation approved.');
        expect(res.body.tempPassword).toBeUndefined();

        const profile = await knex('profiles').where({ id: userId }).first();
        const filiacao = await knex('filiacoes').where({ id: filiacaoId }).first();

        expect(profile.status_conta).toBe('ativo');
        expect(profile.password_hash).toBeTruthy();
        expect(filiacao.status).toBe('concluido');
    });

    it('reject should set affiliation rejected and profile pendente_docs', async () => {
        const [filiacaoId] = await knex('filiacoes').insert({
            user_id: userId,
            status: 'em_processamento',
            protocolo: '#REJ12345',
            status_atendimento: 'aberto'
        });

        const res = await request(app)
            .post(`/api/affiliations/${filiacaoId}/reject`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ observacoes: 'Pendencia documental' });

        expect(res.statusCode).toBe(200);

        const profile = await knex('profiles').where({ id: userId }).first();
        const filiacao = await knex('filiacoes').where({ id: filiacaoId }).first();

        expect(profile.status_conta).toBe('pendente_docs');
        expect(filiacao.status).toBe('rejeitado');
    });

    it('status endpoint should return latest affiliation status', async () => {
        await knex('filiacoes').insert({
            user_id: userId,
            status: 'em_processamento',
            protocolo: '#STAT1234',
            status_atendimento: 'aberto'
        });

        const res = await request(app)
            .post('/api/affiliations/status')
            .send({ cpf: userCpf });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('em_processamento');
        expect(res.body.protocolo).toBe('#STAT1234');
    });

    it('documents route should require auth and block non-owner user', async () => {
        await knex('documentos').insert({
            user_id: userId,
            filiacao_id: null,
            url_arquivo: `uploads/${sampleFilename}`,
            tipo_documento: 'outro'
        });

        const unauthenticated = await request(app).get(`/api/documents/${sampleFilename}`);
        expect(unauthenticated.statusCode).toBe(401);

        const forbidden = await request(app)
            .get(`/api/documents/${sampleFilename}`)
            .set('Authorization', `Bearer ${otherUserToken}`);
        expect(forbidden.statusCode).toBe(403);
    });

    it('assume and transfer flow should enforce roles and update assignee', async () => {
        const [filiacaoId] = await knex('filiacoes').insert({
            user_id: userId,
            status: 'em_processamento',
            protocolo: '#FLOW1234',
            status_atendimento: 'aberto'
        });

        const assume = await request(app)
            .post(`/api/affiliations/${filiacaoId}/assume`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(assume.statusCode).toBe(200);

        const requestTransfer = await request(app)
            .post(`/api/affiliations/${filiacaoId}/request-transfer`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(requestTransfer.statusCode).toBe(200);

        const denyByRegularAdmin = await request(app)
            .post(`/api/affiliations/${filiacaoId}/deny-transfer`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(denyByRegularAdmin.statusCode).toBe(403);

        const transferBySuperAdmin = await request(app)
            .post(`/api/affiliations/${filiacaoId}/transfer`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({ targetAdminId: superAdminId });
        expect(transferBySuperAdmin.statusCode).toBe(200);

        const filiacao = await knex('filiacoes').where({ id: filiacaoId }).first();
        expect(filiacao.responsavel_admin_id).toBe(superAdminId);
        expect(filiacao.transfer_status).toBeNull();
    });

    it('chat should allow owner access and block profanity', async () => {
        const [filiacaoId] = await knex('filiacoes').insert({
            user_id: userId,
            status: 'em_processamento',
            protocolo: '#CHAT1234',
            status_atendimento: 'aberto'
        });

        const sendByOwner = await request(app)
            .post(`/api/affiliations/${filiacaoId}/chat`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ message: 'Tudo certo por aqui.' });
        expect(sendByOwner.statusCode).toBe(200);

        const listByOwner = await request(app)
            .get(`/api/affiliations/${filiacaoId}/chat`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(listByOwner.statusCode).toBe(200);
        expect(Array.isArray(listByOwner.body)).toBe(true);
        expect(listByOwner.body.length).toBeGreaterThan(0);

        const profanity = await request(app)
            .post(`/api/affiliations/${filiacaoId}/chat`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ message: 'que merda de sistema' });
        expect(profanity.statusCode).toBe(400);
    });

    it('disaffiliation and reactivation flow should update account lifecycle', async () => {
        const [filiacaoId] = await knex('filiacoes').insert({
            user_id: userId,
            status: 'concluido',
            protocolo: '#LIFE1234',
            status_atendimento: 'concluido'
        });
        await knex('profiles').where({ id: userId }).update({ status_conta: 'ativo' });

        const requestDisaffiliation = await request(app)
            .post('/api/affiliations/request-disaffiliation')
            .set('Authorization', `Bearer ${userToken}`);
        expect(requestDisaffiliation.statusCode).toBe(200);

        const approveDisaffiliation = await request(app)
            .post(`/api/affiliations/${filiacaoId}/approve-disaffiliation`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(approveDisaffiliation.statusCode).toBe(200);

        let profile = await knex('profiles').where({ id: userId }).first();
        expect(profile.status_conta).toBe('inativo');

        const requestReactivation = await request(app)
            .post('/api/affiliations/request-reactivation')
            .set('Authorization', `Bearer ${userToken}`);
        expect(requestReactivation.statusCode).toBe(200);

        const approveReactivation = await request(app)
            .post(`/api/affiliations/${filiacaoId}/approve-reactivation`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(approveReactivation.statusCode).toBe(200);

        profile = await knex('profiles').where({ id: userId }).first();
        expect(profile.status_conta).toBe('ativo');
    });
});
