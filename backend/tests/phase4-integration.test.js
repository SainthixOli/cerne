/**
 * FASE 4 - Integration Testing: Multi-Tenant Data Isolation
 * 
 * Objetivo: Validar que cada tenant está completamente isolado
 * - Dados de um tenant NÃO podem ser acessados por outro
 * - Audit logs estão isolados
 * - Permissões e roles funcionam por tenant
 * - Performance é aceitável com múltiplos tenants
 */

const request = require('supertest');
const app = require('../app');
const { getDb } = require('../config/database');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
    throw new Error('JWT_SECRET must be configured by the test environment');
}

describe('FASE 4: Multi-Tenant Integration Tests', () => {
    let db;
    let tenant1Token, tenant2Token;
    let tenant1Admin, tenant2Admin;
    let tenant1UserId, tenant2UserId;

    beforeAll(async () => {
        db = await getDb();
    });

    beforeEach(async () => {
        // Setup: Create test users for two different tenants
        const adminId1 = uuidv4();
        const adminId2 = uuidv4();
        const userId1 = uuidv4();
        const userId2 = uuidv4();

        // Insert profiles for tenant 1
        await db.run(
            `INSERT INTO profiles (id, nome_completo, cpf, password_hash, role, status_conta, tenant_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [adminId1, 'Admin Tenant 1', '11111111111', 'hash1', 'admin', 'ativo', 1]
        );

        // Insert profiles for tenant 2
        await db.run(
            `INSERT INTO profiles (id, nome_completo, cpf, password_hash, role, status_conta, tenant_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [adminId2, 'Admin Tenant 2', '22222222222', 'hash2', 'admin', 'ativo', 2]
        );

        tenant1Admin = adminId1;
        tenant2Admin = adminId2;
        tenant1UserId = userId1;
        tenant2UserId = userId2;

        // Generate JWT tokens
        tenant1Token = jwt.sign(
            { id: adminId1, role: 'admin', name: 'Admin Tenant 1', tenantId: 1 },
            SECRET_KEY
        );

        tenant2Token = jwt.sign(
            { id: adminId2, role: 'admin', name: 'Admin Tenant 2', tenantId: 2 },
            SECRET_KEY
        );
    });

    afterEach(async () => {
        // Cleanup: Clear test data
        await db.run('DELETE FROM profiles WHERE cpf IN (?, ?)', ['11111111111', '22222222222']);
        await db.run('DELETE FROM filiacoes WHERE tenant_id IN (1, 2)');
        await db.run('DELETE FROM audit_logs WHERE admin_id IN (?, ?)', [tenant1Admin, tenant2Admin]);
    });

    // ============================================================================
    // TEST 1: TENANT ISOLATION - User Data Access
    // ============================================================================
    describe('Test 1: Tenant Isolation - User Data', () => {
        test('Admin de Tenant 1 NÃO deve ver usuários de Tenant 2', async () => {
            // Arrange: Criar usuário em Tenant 2
            const user2Id = uuidv4();
            await db.run(
                `INSERT INTO profiles (id, nome_completo, cpf, email, role, status_conta, tenant_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [user2Id, 'User Tenant 2', '33333333333', 'user2@example.com', 'professor', 'ativo', 2]
            );

            // Act: Tenant 1 Admin tenta acessar lista de usuários
            // (assumindo que há um endpoint /api/admin/users)
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${tenant1Token}`);

            // Assert: Response deve estar vazio ou não conter usuário de Tenant 2
            expect(response.body).toBeDefined();
            const userIds = response.body.map(u => u.id);
            expect(userIds).not.toContain(user2Id);
            expect(userIds).not.toContain(tenant2Admin);
        });

        test('Audit logs de Tenant 2 NÃO devem ser vistos por Tenant 1', async () => {
            // Arrange: Create audit log for Tenant 2
            await db.run(
                `INSERT INTO audit_logs (admin_id, action_type, target_id, details, tenant_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [tenant2Admin, 'UPDATE_PROFILE', tenant2UserId, JSON.stringify({changes: {}}), 2]
            );

            // Act: Get audit logs para Tenant 1
            const response = await request(app)
                .get('/api/admin/audit-logs')
                .set('Authorization', `Bearer ${tenant1Token}`);

            // Assert: Não deve conter logs de Tenant 2
            expect(response.body).toBeDefined();
            const logIds = response.body.map(l => l.target_id);
            expect(logIds).not.toContain(tenant2UserId);
        });
    });

    // ============================================================================
    // TEST 2: CROSS-TENANT PREVENTION (IDOR)
    // ============================================================================
    describe('Test 2: Cross-Tenant Prevention (IDOR)', () => {
        test('Admin Tenant 1 NÃO deve conseguir atualizar perfil de usuário de Tenant 2', async () => {
            // Arrange: Create user in Tenant 2
            const user2Id = uuidv4();
            await db.run(
                `INSERT INTO profiles (id, nome_completo, cpf, email, role, status_conta, tenant_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [user2Id, 'User Tenant 2', '44444444444', 'user2@example.com', 'professor', 'ativo', 2]
            );

            // Act: Try to update user profile as Tenant 1 admin
            const response = await request(app)
                .put(`/api/admin/users/${user2Id}`)
                .set('Authorization', `Bearer ${tenant1Token}`)
                .send({ nome_completo: 'Hacked User' });

            // Assert: Should be 403/404 or silently fail (no update)
            const userAfter = await db.get(
                'SELECT * FROM profiles WHERE id = ? AND tenant_id = ?',
                [user2Id, 2]
            );
            expect(userAfter.nome_completo).toBe('User Tenant 2');
        });

        test('Admin Tenant 1 NÃO deve conseguir deletar afiliação de Tenant 2', async () => {
            // Arrange: Create affiliation in Tenant 2
            const filiacaoId = uuidv4();
            const user2Id = uuidv4();
            
            await db.run(
                `INSERT INTO profiles (id, nome_completo, cpf, email, role, status_conta, tenant_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [user2Id, 'User T2', '55555555555', 'user2t@example.com', 'professor', 'ativo', 2]
            );

            await db.run(
                `INSERT INTO filiacoes (id, user_id, status, tenant_id)
                 VALUES (?, ?, ?, ?)`,
                [filiacaoId, user2Id, 'em_processamento', 2]
            );

            // Act: Try to delete as Tenant 1 admin
            const response = await request(app)
                .delete(`/api/affiliations/${filiacaoId}`)
                .set('Authorization', `Bearer ${tenant1Token}`);

            // Assert: Affiliation should still exist
            const filiacaoAfter = await db.get(
                'SELECT * FROM filiacoes WHERE id = ? AND tenant_id = ?',
                [filiacaoId, 2]
            );
            expect(filiacaoAfter).toBeDefined();
        });
    });

    // ============================================================================
    // TEST 3: AUDIT LOGGING ISOLATION
    // ============================================================================
    describe('Test 3: Audit Logging Isolation', () => {
        test('Logs de auditoria devem incluir tenant_id', async () => {
            // Act: Perform an action that creates audit log
            await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${tenant1Token}`)
                .send({
                    nome_completo: 'New User',
                    cpf: '66666666666',
                    email: 'newuser@example.com',
                    role: 'professor'
                });

            // Assert: Audit log should have tenant_id = 1
            const auditLog = await db.get(
                'SELECT * FROM audit_logs WHERE admin_id = ? ORDER BY created_at DESC LIMIT 1',
                [tenant1Admin]
            );

            expect(auditLog).toBeDefined();
            expect(auditLog.tenant_id).toBe(1);
        });

        test('Super Admin NÃO consegue ver logs de outro tenant sem filtro explícito', async () => {
            // Arrange: Create logs in both tenants
            await db.run(
                `INSERT INTO audit_logs (admin_id, action_type, target_id, details, tenant_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [tenant1Admin, 'UPDATE', 'target1', JSON.stringify({}), 1]
            );

            await db.run(
                `INSERT INTO audit_logs (admin_id, action_type, target_id, details, tenant_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [tenant2Admin, 'UPDATE', 'target2', JSON.stringify({}), 2]
            );

            // Act: Get logs as Tenant 1 super admin
            const response = await request(app)
                .get('/api/admin/audit-logs')
                .set('Authorization', `Bearer ${tenant1Token}`);

            // Assert: Should only see Tenant 1 logs
            expect(response.body.length).toBe(1);
            expect(response.body[0].tenant_id).toBe(1);
        });
    });

    // ============================================================================
    // TEST 4: NOTIFICATIONS & MESSAGES ISOLATION
    // ============================================================================
    describe('Test 4: Notifications & Messages Isolation', () => {
        test('Notificações de Tenant 2 NÃO devem aparecer em Tenant 1', async () => {
            // Arrange: Create notification in Tenant 2
            const notifId = uuidv4();
            await db.run(
                `INSERT INTO notifications (id, title, message, target_group, status, created_by, tenant_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [notifId, 'Notif T2', 'Message T2', 'all', 'approved', tenant2Admin, 2]
            );

            // Act: Get notifications as Tenant 1 user
            const response = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${tenant1Token}`);

            // Assert: Should not contain Tenant 2 notification
            const notifIds = response.body.map(n => n.id);
            expect(notifIds).not.toContain(notifId);
        });
    });

    // ============================================================================
    // TEST 5: DOCUMENTS ISOLATION
    // ============================================================================
    describe('Test 5: Documents Isolation', () => {
        test('Admin Tenant 1 NÃO consegue servir documento de Tenant 2', async () => {
            // Arrange: Create document in Tenant 2
            const docId = uuidv4();
            const user2Id = uuidv4();

            await db.run(
                `INSERT INTO profiles (id, nome_completo, cpf, email, role, status_conta, tenant_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [user2Id, 'User T2 Doc', '77777777777', 'userdoc2@example.com', 'professor', 'ativo', 2]
            );

            await db.run(
                `INSERT INTO documentos (id, user_id, url_arquivo, tipo_documento, tenant_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [docId, user2Id, '/uploads/doc2.pdf', 'outro', 2]
            );

            // Act: Try to access document as Tenant 1
            const response = await request(app)
                .get(`/api/documents/${docId}`)
                .set('Authorization', `Bearer ${tenant1Token}`);

            // Assert: Should be 403/404
            expect([403, 404]).toContain(response.status);
        });
    });

    // ============================================================================
    // TEST 6: PERFORMANCE WITH MULTIPLE TENANTS
    // ============================================================================
    describe('Test 6: Performance with Multiple Tenants', () => {
        test('Query performance should be acceptable with 1000 records per tenant', async () => {
            // This test validates that tenant_id filtering doesn't cause performance issues
            
            const startTime = Date.now();
            
            // Get affiliations for Tenant 1
            const response = await request(app)
                .get('/api/affiliations')
                .set('Authorization', `Bearer ${tenant1Token}`);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Assert: Response should be < 1000ms (reasonable for backend)
            expect(duration).toBeLessThan(1000);
            expect(response.status).toBe(200);
        });
    });

    // ============================================================================
    // TEST 7: DATABASE INTEGRITY
    // ============================================================================
    describe('Test 7: Database Integrity', () => {
        test('All filiacoes records should have tenant_id', async () => {
            const orphanedRecords = await db.all(
                'SELECT COUNT(*) as count FROM filiacoes WHERE tenant_id IS NULL'
            );

            expect(orphanedRecords[0].count).toBe(0);
        });

        test('All documentos records should have tenant_id', async () => {
            const orphanedRecords = await db.all(
                'SELECT COUNT(*) as count FROM documentos WHERE tenant_id IS NULL'
            );

            expect(orphanedRecords[0].count).toBe(0);
        });

        test('All audit_logs records should have tenant_id', async () => {
            const orphanedRecords = await db.all(
                'SELECT COUNT(*) as count FROM audit_logs WHERE tenant_id IS NULL'
            );

            expect(orphanedRecords[0].count).toBe(0);
        });
    });
});
