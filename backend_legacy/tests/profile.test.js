const request = require('supertest');
const app = require('../src/app');
const knex = require('../src/config/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Profile Endpoints', () => {
    let token;
    let userId = 'user-uuid-123';

    beforeEach(async () => {
        // Create user
        const hashedPassword = await bcrypt.hash('password123', 10);
        await knex('profiles').insert({
            id: userId,
            nome_completo: 'Profile User',
            cpf: '99988877766',
            email: 'profile@example.com',
            password_hash: hashedPassword,
            status_conta: 'ativo',
            role: 'professor'
        });

        // Generate token
        token = jwt.sign(
            { id: userId, role: 'professor', name: 'Profile User' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        await knex('profiles').where({ id: userId }).del();
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

        expect(res.statusCode).toBe(403); // Middleware usually returns 403 for invalid verify
    });
});
