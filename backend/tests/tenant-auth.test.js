const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const request = require('supertest');
const knex = require('../src/config/connection');
const authController = require('../src/controllers/authController');
const affiliationController = require('../src/controllers/affiliationController');
const emailService = require('../src/services/emailService');
const pdfService = require('../src/services/pdfService');
const publicTenant = require('../src/middlewares/publicTenant');
const { authenticateToken } = require('../src/middlewares/auth');

const app = express();
app.use(express.json());
app.post('/login', publicTenant, authController.login);
app.post('/forgot', publicTenant, authController.forgotPassword);
app.post('/reset', publicTenant, authController.resetPassword);
app.post('/register', publicTenant, affiliationController.register);
app.post('/status', publicTenant, affiliationController.checkStatus);
app.get('/protected', authenticateToken, (req, res) => res.json(req.user));

const firstCpf = '10000000001';
const otherCpf = '20000000002';
const passwordOne = 'Secure-Password-1';
const passwordTwo = 'Secure-Password-2';
let tenantOne;
let tenantTwo;

const header = (slug) => ({ 'X-Tenant-Slug': slug });
const login = (slug, cpf = firstCpf, password = passwordOne) => request(app)
    .post('/login').set(header(slug)).send({ cpf, password });

async function seedProfile({ id, tenantId, cpf = firstCpf, email, password = passwordOne,
    role = 'professor', status = 'ativo' }) {
    await knex('profiles').insert({
        id, tenant_id: tenantId, cpf, email,
        nome_completo: 'Pessoa de teste', role, status_conta: status,
        password_hash: await bcrypt.hash(password, 4)
    });
}

beforeEach(async () => {
    await knex('tenants').del();
    [{ id: tenantOne }] = await knex('tenants')
        .insert({ name: 'Tenant um', slug: 'tenant-um', status: 'ATIVO' })
        .returning('id');
    [{ id: tenantTwo }] = await knex('tenants')
        .insert({ name: 'Tenant dois', slug: 'tenant-dois', status: 'ATIVO' })
        .returning('id');
});

afterEach(async () => {
    jest.restoreAllMocks();
});

describe('login and authoritative tenant selection', () => {
    test('members with the same CPF in two tenants receive their own tenant and role', async () => {
        await seedProfile({ id: 'member-one', tenantId: tenantOne, email: 'one@example.test' });
        await seedProfile({ id: 'member-two', tenantId: tenantTwo, email: 'two@example.test', password: passwordTwo });

        const first = await login('tenant-um').expect(200);
        const second = await login('tenant-dois', firstCpf, passwordTwo).expect(200);
        expect(jwt.verify(first.body.token, process.env.JWT_SECRET).tenantId).toBe(tenantOne);
        expect(jwt.verify(second.body.token, process.env.JWT_SECRET).tenantId).toBe(tenantTwo);
        await login('tenant-dois').expect(401);
    });

    test('missing, unknown and inactive tenant are rejected without fallback', async () => {
        await seedProfile({ id: 'member-one', tenantId: tenantOne, email: 'one@example.test' });
        await request(app).post('/login').send({ cpf: firstCpf, password: passwordOne }).expect(400);
        await login('not-existing').expect(404);
        await knex('tenants').where({ id: tenantOne }).update({ status: 'SUSPENSO' });
        await login('tenant-um').expect(403);
        await knex('tenants').where({ id: tenantOne }).update({ status: 'INATIVO' });
        await login('tenant-um').expect(403);
    });

    test('database rejects account without tenant and inactive account never receives a token', async () => {
        await expect(seedProfile({ id: 'orphan', tenantId: null, email: 'orphan@example.test' }))
            .rejects.toThrow();
        await login('tenant-um').expect(401);
        await seedProfile({ id: 'inactive', tenantId: tenantOne, cpf: otherCpf,
            email: 'inactive@example.test', status: 'inativo' });
        const response = await login('tenant-um', otherCpf).expect(401);
        expect(response.body.token).toBeUndefined();
    });

    test('super_admin selects a linked tenant explicitly; ambiguous identities are rejected', async () => {
        await seedProfile({ id: 'super-one', tenantId: tenantOne, email: 'super@example.test', role: 'super_admin' });
        await knex('tenant_super_admins').insert([
            { user_id: 'super-one', tenant_id: tenantOne },
            { user_id: 'super-one', tenant_id: tenantTwo }
        ]);
        await request(app).post('/login').send({ cpf: firstCpf, password: passwordOne }).expect(400);
        const linked = await login('tenant-dois').expect(200);
        expect(jwt.verify(linked.body.token, process.env.JWT_SECRET).tenantId).toBe(tenantTwo);
        await knex('tenants').where({ id: tenantOne }).update({ status: 'SUSPENSO' });
        await login('tenant-dois').expect(403);
        await request(app).get('/protected').set('Authorization', `Bearer ${linked.body.token}`).expect(401);
        await knex('tenants').where({ id: tenantOne }).update({ status: 'ATIVO' });

        await seedProfile({ id: 'member-two', tenantId: tenantTwo, email: 'member@example.test' });
        await login('tenant-dois').expect(409);
    });
});

describe('JWT database state', () => {
    test('missing tenant, expired and invalid JWT are rejected', async () => {
        await seedProfile({ id: 'member-one', tenantId: tenantOne, email: 'one@example.test' });
        const noTenant = jwt.sign({ id: 'member-one', role: 'professor' }, process.env.JWT_SECRET);
        const expired = jwt.sign({ id: 'member-one', role: 'professor', tenantId: tenantOne },
            process.env.JWT_SECRET, { expiresIn: -1 });
        await request(app).get('/protected').set('Authorization', `Bearer ${noTenant}`).expect(401);
        await request(app).get('/protected').set('Authorization', `Bearer ${expired}`).expect(401);
        await request(app).get('/protected').set('Authorization', 'Bearer invalid').expect(401);
    });

    test('role, account status, tenant status and super-admin link are rechecked', async () => {
        await seedProfile({ id: 'super-one', tenantId: tenantOne, email: 'one@example.test', role: 'super_admin' });
        await knex('tenant_super_admins').insert({ user_id: 'super-one', tenant_id: tenantTwo });
        const token = (await login('tenant-dois')).body.token;
        await request(app).get('/protected').set('Authorization', `Bearer ${token}`).expect(200);
        await knex('tenant_super_admins').where({ user_id: 'super-one', tenant_id: tenantTwo }).del();
        await request(app).get('/protected').set('Authorization', `Bearer ${token}`).expect(401);

        const homeToken = (await login('tenant-um')).body.token;
        await knex('profiles').where({ id: 'super-one' }).update({ role: 'admin' });
        await request(app).get('/protected').set('Authorization', `Bearer ${homeToken}`).expect(401);
        await knex('profiles').where({ id: 'super-one' }).update({ role: 'super_admin', status_conta: 'inativo' });
        await request(app).get('/protected').set('Authorization', `Bearer ${homeToken}`).expect(401);
        await knex('profiles').where({ id: 'super-one' }).update({ status_conta: 'ativo' });
        await knex('tenants').where({ id: tenantOne }).update({ status: 'SUSPENSO' });
        await request(app).get('/protected').set('Authorization', `Bearer ${homeToken}`).expect(401);
    });
});

describe('public registration and password reset isolation', () => {
    test('public CPF status is resolved only inside the selected tenant', async () => {
        await seedProfile({ id: 'member-one', tenantId: tenantOne, email: 'one@example.test' });
        await seedProfile({ id: 'member-two', tenantId: tenantTwo, email: 'two@example.test' });
        await knex('filiacoes').insert([
            { user_id: 'member-one', tenant_id: tenantOne, status: 'em_processamento', protocolo: 'TEST-ONE' },
            { user_id: 'member-two', tenant_id: tenantTwo, status: 'concluido', protocolo: 'TEST-TWO' }
        ]);
        const first = await request(app).post('/status').set(header('tenant-um')).send({ cpf: firstCpf }).expect(200);
        const second = await request(app).post('/status').set(header('tenant-dois')).send({ cpf: firstCpf }).expect(200);
        expect(first.body.protocolo).toBe('TEST-ONE');
        expect(second.body.protocolo).toBe('TEST-TWO');
    });

    test('same identity is distinct across tenants; duplicate in one tenant is only a reapplication', async () => {
        jest.spyOn(pdfService, 'generateAffiliationPDF').mockImplementation((data, res) => res.end('test-pdf'));
        const data = { nome: 'Pessoa de teste', cpf: firstCpf, email: 'same@example.test' };
        await request(app).post('/register').set(header('tenant-um')).send(data).expect(200);
        await request(app).post('/register').set(header('tenant-dois')).send(data).expect(200);
        await request(app).post('/register').set(header('tenant-um')).send(data).expect(200);
        const users = await knex('profiles').where({ cpf: firstCpf });
        expect(users).toHaveLength(2);
        const firstUser = users.find((user) => user.tenant_id === tenantOne);
        const secondUser = users.find((user) => user.tenant_id === tenantTwo);
        expect(firstUser.id).not.toBe(secondUser.id);
        expect(await knex('filiacoes').where({ user_id: firstUser.id })).toHaveLength(2);
        expect(await knex('filiacoes').where({ user_id: secondUser.id })).toHaveLength(1);
        await request(app).post('/register').set(header('tenant-um'))
            .send({ ...data, email: 'different@example.test' }).expect(409);
    });

    test('reset token is tenant-scoped, expires and cannot be reused', async () => {
        jest.spyOn(emailService, 'sendResetPasswordEmail').mockResolvedValue(undefined);
        await seedProfile({ id: 'member-one', tenantId: tenantOne, email: 'one@example.test' });
        await seedProfile({ id: 'member-two', tenantId: tenantTwo, email: 'two@example.test' });
        await request(app).post('/forgot').set(header('tenant-um')).send({ cpf: firstCpf }).expect(200);
        const first = await knex('profiles').select('reset_token').where({ id: 'member-one' }).first();
        const second = await knex('profiles').select('reset_token').where({ id: 'member-two' }).first();
        expect(first.reset_token).toBeTruthy();
        expect(second.reset_token).toBeNull();

        await request(app).post('/reset').set(header('tenant-dois'))
            .send({ token: first.reset_token, newPassword: passwordTwo }).expect(400);
        await request(app).post('/reset').set(header('tenant-um'))
            .send({ token: 'invalid', newPassword: passwordTwo }).expect(400);
        await request(app).post('/reset').set(header('tenant-um'))
            .send({ token: first.reset_token, newPassword: passwordTwo }).expect(200);
        await request(app).post('/reset').set(header('tenant-um'))
            .send({ token: first.reset_token, newPassword: passwordOne }).expect(400);
        await login('tenant-um', firstCpf, passwordTwo).expect(200);
        await login('tenant-dois').expect(200);

        await request(app).post('/forgot').set(header('tenant-um')).send({ cpf: firstCpf }).expect(200);
        const fresh = await knex('profiles').select('reset_token').where({ id: 'member-one' }).first();
        await knex('profiles').where({ id: 'member-one' })
            .update({ reset_token_expires: new Date('2000-01-01T00:00:00.000Z') });
        await request(app).post('/reset').set(header('tenant-um'))
            .send({ token: fresh.reset_token, newPassword: passwordOne }).expect(400);
    });
});
