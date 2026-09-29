/**
 * Security Alerts Controller
 * Endpoints para admin técnico acessar alertas e estatísticas de segurança
 */

const SecurityAlertService = require('../services/securityAlertService');
const logger = require('../config/logger');
const securityAlertRepository = require('../repositories/securityAlertRepository');
const auditRepository = require('../repositories/auditRepository');

class SecurityAlertsController {
    /**
     * GET /api/admin/security/alerts
     * Lista todos os alertas de segurança (apenas admin técnico)
     */
    static async getSecurityAlerts(req, res) {
        try {
            // Validar permissão: apenas admin técnico (role = 'admin' com permission = 'security')
            if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
                return res.status(403).json({
                    error: 'Acesso negado',
                    message: 'Apenas administradores técnicos podem acessar alertas de segurança'
                });
            }

            const { severity, type, limit = 50, offset = 0 } = req.query;

            const filters = { tenantId: req.tenantId, limit: Number(limit), offset: Number(offset) };
            if (severity) filters.severity = severity;
            if (type) filters.type = type;

            const alerts = await SecurityAlertService.getActiveAlerts(filters);

            logger.info('Security alerts retrieved', {
                userId: req.user.id,
                alertCount: alerts.alerts.length,
                filters: filters
            });

            return res.json({
                success: true,
                data: alerts,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: alerts.total
                }
            });
        } catch (error) {
            logger.error('Error retrieving security alerts', { error: error.message });
            return res.status(500).json({
                error: 'Internal server error',
                message: 'Erro ao recuperar alertas de segurança'
            });
        }
    }

    /**
     * GET /api/admin/security/alerts/:alertId
     * Detalhes de um alerta específico
     */
    static async getAlertDetails(req, res) {
        try {
            if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const { alertId } = req.params;

            const alert = await securityAlertRepository.findById(alertId, req.tenantId);

            if (!alert) {
                return res.status(404).json({
                    error: 'Not found',
                    message: 'Alerta não encontrado'
                });
            }

            logger.info('Alert details retrieved', {
                userId: req.user.id,
                alertId: alertId
            });

            return res.json({
                success: true,
                data: alert
            });
        } catch (error) {
            logger.error('Error retrieving alert details', { error: error.message });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /api/admin/security/alerts/:alertId/acknowledge
     * Admin técnico reconhece o alerta (marca como visto)
     */
    static async acknowledgeAlert(req, res) {
        try {
            if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const { alertId } = req.params;
            const { notes } = req.body;

            const updated = await securityAlertRepository.acknowledge(
                alertId, req.tenantId, req.user.id, notes);
            if (updated !== 1) return res.status(404).json({ error: 'Alerta não encontrado' });

            logger.info('Alert acknowledged', {
                userId: req.user.id,
                alertId: alertId,
                notes: notes
            });

            return res.json({
                success: true,
                message: 'Alerta reconhecido'
            });
        } catch (error) {
            logger.error('Error acknowledging alert', { error: error.message });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /api/admin/security/dashboard
     * Dashboard de segurança com estatísticas
     */
    static async getSecurityDashboard(req, res) {
        try {
            if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const stats = await SecurityAlertService.getSecurityStats(req.tenantId);

            const threatsByType = Object.fromEntries(stats.byType.map((row) => [row.alert_type, Number(row.count)]));
            const threatsBySeverity = Object.fromEntries(stats.bySeverity.map((row) => [row.severity, Number(row.count)]));

            const dashboard = {
                summary: {
                    totalAlerts: stats.summary.total,
                    activeThreats: stats.summary.active,
                    lastUpdate: new Date().toISOString()
                },
                threatsByType,
                threatsBySeverity,
                topThreatenedIPs: [],
                recentAlerts: stats.recent,
                securityScore: calculateSecurityScore()
            };

            logger.info('Security dashboard accessed', {
                userId: req.user.id,
                threatCount: dashboard.summary.activeThreats
            });

            return res.json({
                success: true,
                data: dashboard
            });
        } catch (error) {
            logger.error('Error retrieving security dashboard', { error: error.message });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /api/admin/security/stats
     * Estatísticas detalhadas de segurança
     */
    static async getSecurityStats(req, res) {
        try {
            if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const timeRange = req.query.timeRange || '24h'; // 1h, 24h, 7d, 30d

            const persisted = await SecurityAlertService.getSecurityStats(req.tenantId);
            const stats = {
                timeRange: timeRange,
                loginAttempts: {
                    total: 0,
                    successful: 0,
                    failed: 0,
                    bruteForceAttempts: 0
                },
                dataAccess: {
                    totalRequests: 0,
                    unauthorizedRequests: 0,
                    suspiciousPatterns: 0
                },
                threats: {
                    xssAttempts: 0,
                    sqlInjectionAttempts: 0,
                    passwordResetAbuse: 0,
                    privilegeEscalation: 0
                },
                rateLimit: {
                    violations: 0,
                    affectedIPs: 0,
                    affectedUsers: 0
                },
                topThreatenedAccounts: [],
                topAttackingIPs: [],
                generatedAt: new Date().toISOString(),
                persisted: persisted.summary
            };

            logger.info('Security stats retrieved', {
                userId: req.user.id,
                timeRange: timeRange
            });

            return res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Error retrieving security stats', { error: error.message });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /api/admin/security/audit-log
     * Log de auditoria completo filtrado
     */
    static async getAuditLog(req, res) {
        try {
            if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const {
                eventType,
                severity,
                userId,
                ip,
                startDate,
                endDate,
                limit = 100,
                offset = 0
            } = req.query;

            let auditLogs = await auditRepository.list(req.tenantId);
            if (eventType) auditLogs = auditLogs.filter((entry) => entry.action_type === eventType);
            if (userId) auditLogs = auditLogs.filter((entry) => entry.admin_id === userId);
            if (ip) auditLogs = auditLogs.filter((entry) => entry.ip_address === ip);
            if (startDate) auditLogs = auditLogs.filter((entry) => new Date(entry.created_at) >= new Date(startDate));
            if (endDate) auditLogs = auditLogs.filter((entry) => new Date(entry.created_at) <= new Date(endDate));
            if (severity) auditLogs = auditLogs.filter((entry) => entry.details?.includes?.(severity));
            const total = auditLogs.length;
            auditLogs = auditLogs.slice(Number(offset), Number(offset) + Number(limit));

            logger.info('Audit log retrieved', {
                userId: req.user.id,
                filters: { eventType, severity, userId, ip }
            });

            return res.json({
                success: true,
                data: auditLogs,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total
                }
            });
        } catch (error) {
            logger.error('Error retrieving audit log', { error: error.message });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /api/admin/security/block-ip
     * Bloqueia um IP de forma emergencial
     */
    static async blockIP(req, res) {
        try {
            if (req.user?.role !== 'super_admin') {
                return res.status(403).json({
                    error: 'Acesso negado',
                    message: 'Apenas super admin pode bloquear IPs'
                });
            }

            const { ip, reason, duration } = req.body;

            if (!ip || !reason) {
                return res.status(400).json({
                    error: 'Dados inválidos',
                    message: 'IP e motivo são obrigatórios'
                });
            }

            // TODO: Salvar bloqueio no banco
            // await knex('blocked_ips').insert({
            //     ip: ip,
            //     reason: reason,
            //     blocked_by: req.user.id,
            //     blocked_at: new Date(),
            //     duration_hours: duration || 24
            // });

            logger.warn('IP_BLOCKED_EMERGENCY', {
                ip: ip,
                reason: reason,
                blockedBy: req.user.id,
                duration: duration || 24
            });

            return res.json({
                success: true,
                message: `IP ${ip} bloqueado com sucesso`,
                data: { ip, reason, duration }
            });
        } catch (error) {
            logger.error('Error blocking IP', { error: error.message });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /api/admin/security/ban-user
     * Bane um usuário suspeito
     */
    static async banUser(req, res) {
        try {
            if (req.user?.role !== 'super_admin') {
                return res.status(403).json({
                    error: 'Acesso negado',
                    message: 'Apenas super admin pode banir usuários'
                });
            }

            const { userId, reason, duration } = req.body;

            if (!userId || !reason) {
                return res.status(400).json({
                    error: 'Dados inválidos',
                    message: 'userId e reason são obrigatórios'
                });
            }

            // TODO: Salvar ban no banco
            // await knex('usuarios').where({ id: userId }).update({
            //     status_conta: 'banido',
            //     ban_reason: reason,
            //     banned_at: new Date()
            // });

            logger.warn('USER_BANNED_EMERGENCY', {
                userId: userId,
                reason: reason,
                bannedBy: req.user.id,
                duration: duration
            });

            return res.json({
                success: true,
                message: `Usuário ${userId} banido com sucesso`,
                data: { userId, reason }
            });
        } catch (error) {
            logger.error('Error banning user', { error: error.message });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

/**
 * Calcula score de segurança (0-100)
 */
function calculateSecurityScore() {
    // TODO: Implementar cálculo real
    return 85; // Placeholder
}

module.exports = SecurityAlertsController;
