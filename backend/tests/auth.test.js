const request = require('supertest');
const app = require('../src/app');
const knex = require('../src/config/connection');

describe('Auth Endpoints', () => {

    // Clean up before running tests (though setup.js handles generic cleanup)
    beforeEach(async () => {
        await knex('profiles').del();
    });

    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({
                nome: 'Test User',
                cpf: '12345678900', // Valid cpf format usually needed but for now simple
                email: 'test@example.com',
                password: 'password123',
                // Add other required fields based on schema/controller validation
                matricula_funcional: '12345',
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

    it('should login with valid credentials', async () => {
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
            role: 'professor'
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                cpf: '11122233344',
                password: 'password123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('id', 'uuid-123');
    });

    it('should fail login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                cpf: '00000000000',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toBe(401);
    });
});
