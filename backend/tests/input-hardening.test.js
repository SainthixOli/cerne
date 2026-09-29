const express = require('express');
const request = require('supertest');
const routes = require('../src/routes');
const settingsRoutes = require('../src/routes/settingsRoutes');
const securityRoutes = require('../src/routes/securityRoutes');
const normalizeErrors = require('../src/middlewares/normalizeErrors');
const errorHandler = require('../src/middlewares/errorHandler');
const { sensibleOperationLimiter } = require('../src/middlewares/rateLimiting');
const schemas = require('../src/validations/schemas');

const extractRoutes = (router, prefix = '') => router.stack
    .filter((layer) => layer.route)
    .flatMap((layer) => Object.keys(layer.route.methods).map((method) => ({
        endpoint: `${method.toUpperCase()} ${prefix}${layer.route.path}`,
        method: method.toUpperCase(),
        handlers: layer.route.stack.map((handler) => handler.handle)
    })));

describe('input and error hardening', () => {
    test('every mutable route declares request validation', () => {
        const registered = [
            ...extractRoutes(routes),
            ...extractRoutes(settingsRoutes, '/settings'),
            ...extractRoutes(securityRoutes, '/admin/security')
        ];
        const mutable = registered.filter(({ method }) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method));
        expect(mutable.length).toBeGreaterThan(0);
        for (const route of mutable) {
            expect({
                endpoint: route.endpoint,
                validated: route.handlers.some((handler) => handler.validationTargets)
            }).toEqual({ endpoint: route.endpoint, validated: true });
        }
    });

    test('sensitive schemas reject unknown fields and weak passwords', () => {
        expect(schemas.changePasswordSchema.validate({ newPassword: 'weak', role: 'super_admin' }).error).toBeDefined();
        expect(schemas.resetPasswordSchema.validate({ token: 'not-a-token', newPassword: 'StrongPass1!xx' }).error).toBeDefined();
        expect(schemas.createAdminSchema.validate({
            nome: 'Test Admin', cpf: '12345678901', email: 'admin@example.com',
            password: 'StrongPass1!xx', tenant_id: 2
        }).error).toBeDefined();
        expect(schemas.changePasswordSchema.validate({
            newPassword: 'StrongPass1!xx', confirmPassword: 'StrongPass1!xx'
        }).error).toBeUndefined();
    });

    test('params and query schemas reject malformed and unexpected input', () => {
        expect(schemas.affiliationIdParamsSchema.validate({ id: '../1' }).error).toBeDefined();
        expect(schemas.performanceQuerySchema.validate({ adminId: 'admin-1', month: '2026-13' }).error).toBeDefined();
        expect(schemas.alertsQuerySchema.validate({ limit: 1000 }).error).toBeDefined();
        expect(schemas.conversationQuerySchema.validate({ mode: 'all', tenant_id: 2 }).error).toBeDefined();
    });

    test('500 responses never expose internal messages, SQL, stack, or local paths', async () => {
        const app = express();
        app.use(express.json(), normalizeErrors);
        app.get('/caught', (req, res) => res.status(500).json({
            error: 'SQLITE_ERROR near SELECT at /Users/private/app.js', stack: 'secret stack'
        }));
        app.get('/thrown', () => {
            throw new Error('SQL password leaked at /Users/private/app.js');
        });
        app.use(errorHandler);

        for (const endpoint of ['/caught', '/thrown']) {
            const response = await request(app).get(endpoint).expect(500);
            expect(response.body).toEqual({ error: 'Erro interno no servidor', code: 'INTERNAL_ERROR' });
            expect(JSON.stringify(response.body)).not.toMatch(/SQL|stack|\/Users|password/i);
        }
    });

    test('sensitive limiter counts ordinary authenticated users', async () => {
        const app = express();
        app.use((req, res, next) => {
            req.user = { id: 'ordinary-member', role: 'professor' };
            next();
        });
        app.post('/limited', sensibleOperationLimiter, (req, res) => res.sendStatus(204));
        for (let attempt = 0; attempt < 5; attempt += 1) await request(app).post('/limited').expect(204);
        const denied = await request(app).post('/limited').expect(429);
        expect(denied.body.code).toBe('SENSITIVE_OPERATION_LIMIT');
    });

    test('the application applies global rate-limit headers', async () => {
        const response = await request(require('../src/app')).get('/').expect(200);
        expect(response.headers).toHaveProperty('ratelimit-policy');
    });
});
