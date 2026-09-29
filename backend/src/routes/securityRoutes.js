/**
 * Security Alerts Routes
 * Endpoints para admin técnico monitorar segurança
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const SecurityAlertsController = require('../controllers/securityAlertsController');
const { adminOperationLimiter } = require('../middlewares/rateLimiting');
const { tenantMiddleware } = require('../middlewares/tenantMiddleware');
const validate = require('../middlewares/validate');
const {
    alertIdParamsSchema,
    alertsQuerySchema,
    acknowledgeAlertSchema,
    securityStatsQuerySchema,
    auditLogQuerySchema,
    blockIpSchema,
    banUserSchema
} = require('../validations/schemas');

/**
 * ALERTAS - Listar e gerenciar alertas de segurança
 */

// GET /api/admin/security/alerts - Lista alertas
router.get('/alerts', authenticateToken, requireRole('admin', 'super_admin'), adminOperationLimiter,
    validate({ query: alertsQuerySchema }), tenantMiddleware, SecurityAlertsController.getSecurityAlerts);

// GET /api/admin/security/alerts/:alertId - Detalhes do alerta
router.get('/alerts/:alertId', authenticateToken, requireRole('admin', 'super_admin'), adminOperationLimiter,
    validate({ params: alertIdParamsSchema }), tenantMiddleware, SecurityAlertsController.getAlertDetails);

// POST /api/admin/security/alerts/:alertId/acknowledge - Reconhecer alerta
router.post('/alerts/:alertId/acknowledge', authenticateToken, requireRole('admin', 'super_admin'), adminOperationLimiter,
    validate({ params: alertIdParamsSchema, body: acknowledgeAlertSchema }), tenantMiddleware, SecurityAlertsController.acknowledgeAlert);

/**
 * DASHBOARD - Visualização em tempo real
 */

// GET /api/admin/security/dashboard - Dashboard principal
router.get('/dashboard', authenticateToken, requireRole('admin', 'super_admin'), adminOperationLimiter, tenantMiddleware, SecurityAlertsController.getSecurityDashboard);

/**
 * ESTATÍSTICAS - Análise de segurança
 */

// GET /api/admin/security/stats - Estatísticas detalhadas
router.get('/stats', authenticateToken, requireRole('admin', 'super_admin'), adminOperationLimiter,
    validate({ query: securityStatsQuerySchema }), tenantMiddleware, SecurityAlertsController.getSecurityStats);

/**
 * AUDITORIA - Logs de auditoria filtrados
 */

// GET /api/admin/security/audit-log - Log de auditoria completo
router.get('/audit-log', authenticateToken, requireRole('admin', 'super_admin'), adminOperationLimiter,
    validate({ query: auditLogQuerySchema }), tenantMiddleware, SecurityAlertsController.getAuditLog);

/**
 * AÇÕES EMERGENCIAIS - Bloqueios e banimentos
 */

// POST /api/admin/security/block-ip - Bloquear IP
router.post('/block-ip', authenticateToken, requireRole('super_admin'), adminOperationLimiter,
    validate({ body: blockIpSchema }), tenantMiddleware, SecurityAlertsController.blockIP);

// POST /api/admin/security/ban-user - Banir usuário
router.post('/ban-user', authenticateToken, requireRole('super_admin'), adminOperationLimiter,
    validate({ body: banUserSchema }), tenantMiddleware, SecurityAlertsController.banUser);

module.exports = router;
