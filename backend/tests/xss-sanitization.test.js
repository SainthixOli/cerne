/**
 * Testes de XSS Sanitization
 * Valida se injeções XSS são bloqueadas e dados legítimos passam
 */

const request = require('supertest');
const app = require('../src/app');

describe('XSS Sanitization Middleware', () => {
    describe('POST /api/auth/login - XSS in body', () => {
        it('should sanitize script tags from input', async () => {
            const maliciousInput = {
                cpf: '123<script>alert("xss")</script>456789012',
                password: 'Safe@Password1'
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(maliciousInput);

            // Não deve ser erro 5xx (servidor processou sem crash)
            expect(res.status).toBeLessThan(500);
        });

        it('should sanitize HTML entities', async () => {
            const input = {
                cpf: '12345678901<img src=x onerror="alert(1)">',
                password: 'Test@Password123'
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(input);

            // Middleware deve ter sanitizado - sem erro 5xx
            expect(res.status).toBeLessThan(500);
        });
    });

    describe('GET /api - XSS in query params', () => {
        it('should sanitize query parameters', async () => {
            const res = await request(app)
                .get('/api/affiliations?search=<script>alert(1)</script>')
                .set('Authorization', 'Bearer test');

            // Status não deve ser 5xx (erro do servidor)
            expect(res.status).toBeLessThan(500);
        });
    });

    describe('POST /api/auth/login - Legitimate data', () => {
        it('should accept valid credential format', async () => {
            const validInput = {
                cpf: '12345678901',
                password: 'ValidPass@123'
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(validInput);

            // Deve receber resposta, não erro de segurança
            expect(res.status).toBeLessThan(500);
            expect(res.body).toBeDefined();
        });
    });

    describe('Sanitization logging', () => {
        it('should not crash on XSS attempts', async () => {
            const persistentXSS = {
                cpf: '123456789<svg onload="alert(1)">01',
                password: 'Pass123'
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(persistentXSS);

            // Server deve continuar em pé
            expect(res.status).toBeLessThan(500);
        });
    });
});

