/**
 * Security Alerts Routes
 * Endpoints para admin técnico monitorar segurança
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const SecurityAlertsController = require('../controllers/securityAlertsController');
const { adminOperationLimiter } = require('../middlewares/rateLimiting');

/**
 * ALERTAS - Listar e gerenciar alertas de segurança
 */

// GET /api/admin/security/alerts - Lista alertas
router.get('/alerts', authenticateToken, adminOperationLimiter, SecurityAlertsController.getSecurityAlerts);

// GET /api/admin/security/alerts/:alertId - Detalhes do alerta
router.get('/alerts/:alertId', authenticateToken, adminOperationLimiter, SecurityAlertsController.getAlertDetails);

// POST /api/admin/security/alerts/:alertId/acknowledge - Reconhecer alerta
router.post('/alerts/:alertId/acknowledge', authenticateToken, adminOperationLimiter, SecurityAlertsController.acknowledgeAlert);

/**
 * DASHBOARD - Visualização em tempo real
 */

// GET /api/admin/security/dashboard - Dashboard principal
router.get('/dashboard', authenticateToken, adminOperationLimiter, SecurityAlertsController.getSecurityDashboard);

/**
 * ESTATÍSTICAS - Análise de segurança
 */

// GET /api/admin/security/stats - Estatísticas detalhadas
router.get('/stats', authenticateToken, adminOperationLimiter, SecurityAlertsController.getSecurityStats);

/**
 * AUDITORIA - Logs de auditoria filtrados
 */

// GET /api/admin/security/audit-log - Log de auditoria completo
router.get('/audit-log', authenticateToken, adminOperationLimiter, SecurityAlertsController.getAuditLog);

/**
 * AÇÕES EMERGENCIAIS - Bloqueios e banimentos
 */

// POST /api/admin/security/block-ip - Bloquear IP
router.post('/block-ip', authenticateToken, adminOperationLimiter, SecurityAlertsController.blockIP);

// POST /api/admin/security/ban-user - Banir usuário
router.post('/ban-user', authenticateToken, adminOperationLimiter, SecurityAlertsController.banUser);

module.exports = router;
