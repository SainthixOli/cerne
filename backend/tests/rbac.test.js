const express = require('express');
jest.mock('../src/services/tenantContext', () => {
    const actual = jest.requireActual('../src/services/tenantContext');
    return {
        ...actual,
        validateAuthenticatedAccount: jest.fn(async (claims) => ({ ...claims, profileTenantId: claims.tenantId }))
    };
});
const request = require('supertest');
const jwt = require('jsonwebtoken');
const routes = require('../src/routes');
const settingsRoutes = require('../src/routes/settingsRoutes');
const securityRoutes = require('../src/routes/securityRoutes');
const { authenticateToken } = require('../src/middlewares/auth');
const { requireRole } = require('../src/middlewares/requireRole');
const { adminOperationLimiter } = require('../src/middlewares/rateLimiting');

const P = 'professor';
const A = 'admin';
const S = 'super_admin';
const M = 'system_manager';
const ALL = [P, A, S, M];
const MEMBERS = [P, A, S];
const ADMINS = [A, S];

// Explicit contract: every registered API endpoint is accounted for, including public routes.
const expected = {
    'GET /health': null,
    'GET /health/live': null,
    'GET /health/ready': null,
    'POST /auth/login': null,
    'GET /auth/session': ALL,
    'POST /auth/logout': null,
    'POST /auth/change-password': ALL,
    'POST /auth/forgot-password': null,
    'POST /auth/reset-password': null,
    'POST /register': null,
    'POST /upload': null,
    'GET /affiliations': ADMINS,
    'GET /affiliations/:userId/history': MEMBERS,
    'POST /affiliations/:id/approve': ADMINS,
    'POST /affiliations/:id/reject': ADMINS,
    'POST /affiliations/:id/assume': ADMINS,
    'POST /affiliations/:id/transfer': [S],
    'POST /affiliations/:id/request-transfer': ADMINS,
    'POST /affiliations/:id/deny-transfer': [S],
    'POST /affiliations/status': null,
    'GET /affiliations/certificate': MEMBERS,
    'POST /affiliations/request-disaffiliation': [P],
    'POST /affiliations/request-reactivation': [P],
    'POST /affiliations/:id/approve-disaffiliation': ADMINS,
    'POST /affiliations/:id/approve-reactivation': ADMINS,
    'GET /documents/my': MEMBERS,
    'POST /documents': MEMBERS,
    'POST /documents/template': ADMINS,
    'GET /documents/:documentId': MEMBERS,
    'GET /profile': ALL,
    'PUT /profile': ALL,
    'GET /profile/photo': ALL,
    'POST /profile/photo': ALL,
    'GET /reports': ADMINS,
    'GET /admin/audit': ADMINS,
    'GET /admin/users': ADMINS,
    'POST /admin/users': [S],
    'PUT /admin/users/:adminId/status': [S],
    'GET /system/stats': [M],
    'POST /system/console': [M],
    'GET /admin/performance': [S],
    'POST /admin/evaluation': [S],
    'GET /admin/evaluation/:adminId': ADMINS,
    'GET /affiliations/:id/chat': MEMBERS,
    'POST /affiliations/:id/chat': MEMBERS,
    'POST /chat/start': MEMBERS,
    'GET /chat/conversations': MEMBERS,
    'GET /chat/:conversationId/messages': MEMBERS,
    'POST /chat/:conversationId/messages': MEMBERS,
    'GET /chat/admins': MEMBERS,
    'POST /notifications/broadcast': ADMINS,
    'DELETE /notifications/:id': [S],
    'POST /notifications/:id/approve': [S],
    'GET /notifications/pending': [S],
    'GET /notifications/my': MEMBERS,
    'GET /settings/': null,
    'PUT /settings/:key': [S],
    'GET /admin/security/alerts': ADMINS,
    'GET /admin/security/alerts/:alertId': ADMINS,
    'POST /admin/security/alerts/:alertId/acknowledge': ADMINS,
    'GET /admin/security/dashboard': ADMINS,
    'GET /admin/security/stats': ADMINS,
    'GET /admin/security/audit-log': ADMINS,
    'POST /admin/security/block-ip': [S],
    'POST /admin/security/ban-user': [S]
};

const extractRoutes = (router, prefix = '') => router.stack
    .filter((layer) => layer.route)
    .flatMap((layer) => Object.keys(layer.route.methods).map((method) => [
        `${method.toUpperCase()} ${prefix}${layer.route.path}`,
        layer.route.stack.map((handler) => handler.handle)
    ]));

const actualRoutes = new Map([
    ...extractRoutes(routes),
    ...extractRoutes(settingsRoutes, '/settings'),
    ...extractRoutes(securityRoutes, '/admin/security')
]);

const sign = (role) => jwt.sign({ id: 'rbac-test-user', role, tenantId: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('RBAC declaration for all endpoints', () => {
    test('each route declares its access policy and authorization precedes other protected work', () => {
        expect([...actualRoutes.keys()].sort()).toEqual(Object.keys(expected).sort());

        for (const [endpoint, handlers] of actualRoutes) {
            const policyIndex = handlers.findIndex((handler) => handler.accessPolicy);
            expect(policyIndex).toBeGreaterThanOrEqual(0);

            const policy = handlers[policyIndex];
            const allowed = expected[endpoint];
            if (allowed === null) {
                expect(policy.accessPolicy).toBe('public');
                expect(policyIndex).toBe(0);
            } else {
                expect(handlers[0]).toBe(authenticateToken);
                expect(policyIndex).toBe(1);
                expect(policy.accessPolicy).toBe('roles');
                expect([...policy.allowedRoles].sort()).toEqual([...allowed].sort());
            }
        }
    });

    test.each(ALL)('%s is allowed only on its declared endpoints', (role) => {
        for (const [endpoint, allowed] of Object.entries(expected)) {
            if (allowed === null) continue;
            const policy = actualRoutes.get(endpoint)[1];
            const next = jest.fn();
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            policy({ user: { role } }, res, next);
            if (allowed.includes(role)) {
                expect(next).toHaveBeenCalledTimes(1);
                expect(res.status).not.toHaveBeenCalled();
            } else {
                expect(next).not.toHaveBeenCalled();
                expect(res.status).toHaveBeenCalledWith(403);
            }
        }
    });
});

describe('RBAC response and controller boundary', () => {
    const endpoint = actualRoutes.get('POST /admin/users');
    const createApp = (limiter = null) => {
        const controller = jest.fn((req, res) => res.sendStatus(204));
        const app = express();
        app.post('/protected', endpoint[0], endpoint[1], ...(limiter ? [limiter] : []), controller);
        return { app, controller };
    };

    test('missing or invalid JWT is 401, without running the controller', async () => {
        const { app, controller } = createApp();
        await request(app).post('/protected').expect(401);
        await request(app).post('/protected').set('Authorization', 'Bearer invalid').expect(401);
        expect(controller).not.toHaveBeenCalled();
    });

    test('professor, admin and system_manager are denied before controller; super_admin passes', async () => {
        const { app, controller } = createApp();
        for (const role of [P, A, M]) {
            await request(app).post('/protected').set('Authorization', `Bearer ${sign(role)}`).expect(403);
        }
        expect(controller).not.toHaveBeenCalled();
        await request(app).post('/protected').set('Authorization', `Bearer ${sign(S)}`).expect(204);
        expect(controller).toHaveBeenCalledTimes(1);
    });

    test('a skipped limiter grants no permission and throttling does not change role policy', async () => {
        const controller = jest.fn((req, res) => res.sendStatus(204));
        const app = express();
        app.post('/limited', authenticateToken, requireRole(A), adminOperationLimiter, controller);
        await request(app).post('/limited').set('Authorization', `Bearer ${sign(P)}`).expect(403);
        await request(app).post('/limited').set('Authorization', `Bearer ${sign(A)}`).expect(204);
        expect(controller).toHaveBeenCalledTimes(1);
        await request(app).post('/limited').set('Authorization', `Bearer ${sign(P)}`).expect(403);
        for (let requestNumber = 1; requestNumber < 20; requestNumber += 1) {
            await request(app).post('/limited').set('Authorization', `Bearer ${sign(A)}`).expect(204);
        }
        await request(app).post('/limited').set('Authorization', `Bearer ${sign(A)}`).expect(429);
        await request(app).post('/limited').set('Authorization', `Bearer ${sign(P)}`).expect(403);
        expect(controller).toHaveBeenCalledTimes(20);
    });
});
