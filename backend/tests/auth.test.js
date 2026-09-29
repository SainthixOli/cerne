const request = require('supertest');
const app = require('../src/app');
const knex = require('../src/config/connection');

describe('Auth Endpoints', () => {
    let tenantId;
    const tenantHeader = { 'X-Tenant-Slug': 'auth-test' };

    // Clean up before running tests (though setup.js handles generic cleanup)
    beforeEach(async () => {
        await knex('affiliation_upload_tokens').del();
        await knex('filiacoes').del();
        await knex('profiles').del();
        await knex('tenants').del();
        [{ id: tenantId }] = await knex('tenants')
            .insert({ name: 'Auth Test', slug: 'auth-test', status: 'ATIVO' })
            .returning('id');
    });

    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/register')
            .set(tenantHeader)
            .send({
                nome: 'Test User',
                cpf: '12345678900', // Valid cpf format usually needed but for now simple
                email: 'test@example.com',
                matricula: '12345',
                telefone: '11999999999',
            });

        // Check expectation based on controller response. 
        // Note: Register usually returns success message or user object.
        expect(res.statusCode).toBeGreaterThanOrEqual(200);
        expect(res.statusCode).toBeLessThan(300);

        const user = await knex('profiles').where({ cpf: '12345678900' }).first();
        expect(user).toBeTruthy();
        expect(user.email).toBe('test@example.com');
    });

    it('should login with a valid cookie without exposing JWT by default', async () => {
        // Register first (or seed)
        // Since we test register above, let's just seed directly for isolation
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('password123', 10);

        await knex('profiles').insert({
            id: 'uuid-123',
            nome_completo: 'Login User',
            cpf: '11122233344',
            email: 'login@example.com',
            password_hash: hashedPassword,
            status_conta: 'ativo', // Ensure account is active if login checks it
            role: 'professor',
            tenant_id: tenantId
        });

        const previousLegacySetting = process.env.LEGACY_BEARER_TOKEN_RESPONSE;
        process.env.LEGACY_BEARER_TOKEN_RESPONSE = 'false';
        let res;
        try {
            res = await request(app)
                .post('/api/auth/login')
                .set(tenantHeader)
                .send({
                    cpf: '11122233344',
                    password: 'password123'
                });
        } finally {
            process.env.LEGACY_BEARER_TOKEN_RESPONSE = previousLegacySetting;
        }

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeUndefined();
        expect(res.body.user).toHaveProperty('id', 'uuid-123');
        expect(res.headers['set-cookie']?.[0]).toContain('cerne_session=');
        expect(res.headers['set-cookie']?.[0]).toContain('HttpOnly');
    });

    it('uses an authoritative cookie session and clears it on logout', async () => {
        const bcrypt = require('bcrypt');
        await knex('profiles').insert({
            id: 'cookie-user', nome_completo: 'Cookie User', cpf: '44455566677',
            email: 'cookie@example.test', password_hash: await bcrypt.hash('password123', 4),
            status_conta: 'ativo', role: 'professor', tenant_id: tenantId
        });
        const agent = request.agent(app);
        await agent.post('/api/auth/login').set(tenantHeader)
            .send({ cpf: '44455566677', password: 'password123' }).expect(200);
        const session = await agent.get('/api/auth/session').expect(200);
        expect(session.body.user).toMatchObject({ id: 'cookie-user', role: 'professor', tenantId });
        const logout = await agent.post('/api/auth/logout').send({}).expect(204);
        expect(logout.headers['set-cookie']?.[0]).toContain('cerne_session=;');
        await agent.get('/api/auth/session').expect(401);
    });

    it('should fail login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set(tenantHeader)
            .send({
                cpf: '00000000000',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toBe(401);
    });
});
