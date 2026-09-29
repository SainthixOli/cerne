const request = require('supertest');
const app = require('../src/app');
const knex = require('../src/config/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Profile Endpoints', () => {
    let token;
    let userId = 'user-uuid-123';
    let tenantId;

    beforeEach(async () => {
        await knex('profiles').where({ id: userId }).del();
        await knex('tenants').where({ slug: 'profile-test' }).del();
        [{ id: tenantId }] = await knex('tenants')
            .insert({ name: 'Profile Test', slug: 'profile-test', status: 'ATIVO' })
            .returning('id');
        // Create user
        const hashedPassword = await bcrypt.hash('password123', 10);
        await knex('profiles').insert({
            id: userId,
            nome_completo: 'Profile User',
            cpf: '99988877766',
            email: 'profile@example.com',
            password_hash: hashedPassword,
            status_conta: 'ativo',
            role: 'professor',
            tenant_id: tenantId
        });

        // Generate token
        token = jwt.sign(
            { id: userId, role: 'professor', name: 'Profile User', tenantId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        await knex('profiles').where({ id: userId }).del();
        await knex('tenants').where({ slug: 'profile-test' }).del();
    });

    it('should access protected profile route with token', async () => {
        const res = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', userId);
    });

    it('should deny access without token', async () => {
        const res = await request(app)
            .get('/api/profile');

        expect(res.statusCode).toBe(401); // Or 403 depending on middleware implementation
    });

    it('should deny access with invalid token', async () => {
        const res = await request(app)
            .get('/api/profile')
            .set('Authorization', 'Bearer invalidtoken');

        expect(res.statusCode).toBe(401); // JWT inválido não autentica o usuário
    });
});
