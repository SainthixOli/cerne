/**
 * Security Alerts Service
 * Detecta anomalias e alertas de segurança para notificar admin técnico
 */

const logger = require('../config/logger');
const AuditLogger = require('../config/auditLogger');

class SecurityAlertService {
    /**
     * Tipos de alertas de segurança
     */
    static ALERT_TYPES = {
        BRUTE_FORCE_LOGIN: 'BRUTE_FORCE_LOGIN',           // 5+ tentativas falhadas em 5 min
        BRUTE_FORCE_PASSWORD: 'BRUTE_FORCE_PASSWORD',     // 3+ reset password em 15 min
        XSS_ATTEMPT: 'XSS_ATTEMPT',                       // Detecção de XSS payload
        SQL_INJECTION: 'SQL_INJECTION',                   // Detecção de SQL injection
        RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',       // Rate limit atingido
        UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',       // 10+ 401/403 em 10 min
        ADMIN_ACTION: 'ADMIN_ACTION',                     // Ação administrativa suspeita
        TOKEN_ABUSE: 'TOKEN_ABUSE',                       // Token inválido/expirado repetido
        GEOGRAPHIC_ANOMALY: 'GEOGRAPHIC_ANOMALY',         // Login de localização diferente
        DATA_EXFILTRATION: 'DATA_EXFILTRATION',           // Tentativa de acesso em massa
        PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',     // Tentativa de elevar permissões
        UNUSUAL_ACTIVITY: 'UNUSUAL_ACTIVITY'              // Padrão de atividade anômalo
    };

    /**
     * Severidade dos alertas
     */
    static SEVERITY = {
        LOW: 'low',       // Vigilância, não-crítico
        MEDIUM: 'medium', // Requer atenção
        HIGH: 'high',     // Crítico, ação imediata
        CRITICAL: 'critical' // Emergência, bloqueio imediato
    };

    /**
     * Cache para rastrear tentativas por IP/User
     */
    static attemptCache = new Map();

    /**
     * Detecta e cria alerta de brute force de login
     */
    static detectBruteForceLogin(ip, cpf, success = false) {
        if (success) {
            // Limpa cache ao login bem-sucedido
            this.clearAttemptCache(`login_${ip}`);
            return null;
        }

        const key = `login_${ip}`;
        const now = Date.now();
        const timeWindow = 5 * 60 * 1000; // 5 minutos

        let attempts = this.attemptCache.get(key) || [];
        attempts = attempts.filter(time => now - time < timeWindow);
        attempts.push(now);

        this.attemptCache.set(key, attempts);

        if (attempts.length >= 5) {
            return this.createAlert({
                type: this.ALERT_TYPES.BRUTE_FORCE_LOGIN,
                severity: this.SEVERITY.HIGH,
                description: `${attempts.length} tentativas de login falhadas do IP ${ip}`,
                sourceIp: ip,
                details: {
                    cpf: cpf ? `${cpf.substring(0, 3)}***${cpf.substring(8)}` : 'unknown',
                    attemptCount: attempts.length,
                    timeWindow: '5 minutos',
                    blockRecommended: attempts.length >= 10
                }
            });
        }

        return null;
    }

    /**
     * Detecta tentativas de reset de senha em massa
     */
    static detectPasswordResetAbuse(ip, cpf) {
        const key = `reset_${ip}`;
        const now = Date.now();
        const timeWindow = 15 * 60 * 1000; // 15 minutos

        let attempts = this.attemptCache.get(key) || [];
        attempts = attempts.filter(time => now - time < timeWindow);
        attempts.push(now);

        this.attemptCache.set(key, attempts);

        if (attempts.length >= 3) {
            return this.createAlert({
                type: this.ALERT_TYPES.BRUTE_FORCE_PASSWORD,
                severity: this.SEVERITY.MEDIUM,
                description: `${attempts.length} tentativas de reset de senha do IP ${ip}`,
                sourceIp: ip,
                details: {
                    cpf: cpf ? `${cpf.substring(0, 3)}***${cpf.substring(8)}` : 'unknown',
                    attemptCount: attempts.length,
                    recommendation: 'Verificar legitimidade das tentativas'
                }
            });
        }

        return null;
    }

    /**
     * Detecta tentativas de XSS
     */
    static detectXSSAttempt(ip, userId, payload) {
        return this.createAlert({
            type: this.ALERT_TYPES.XSS_ATTEMPT,
            severity: this.SEVERITY.HIGH,
            description: `Tentativa de XSS detectada do IP ${ip}`,
            sourceIp: ip,
            userId: userId,
            details: {
                payloadLength: payload.length,
                payloadPreview: payload.substring(0, 100),
                recommendation: 'Revisar fonte do ataque, considerar bloqueio de IP',
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Detecta padrão de SQL Injection
     */
    static detectSQLInjection(ip, userId, parameter, value) {
        const sqlPatterns = [
            /(\sunion\s|\sOR\s|--|;)/gi,
            /('|")\s*(OR|AND)\s*('|")/gi,
            /(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER)/gi,
            /(\*\s*FROM\s*|\*\s*JOIN)/gi
        ];

        const isSuspicious = sqlPatterns.some(pattern => pattern.test(value));

        if (isSuspicious) {
            return this.createAlert({
                type: this.ALERT_TYPES.SQL_INJECTION,
                severity: this.SEVERITY.CRITICAL,
                description: `Tentativa de SQL Injection detectada - parâmetro: ${parameter}`,
                sourceIp: ip,
                userId: userId,
                details: {
                    parameter: parameter,
                    valuePreview: value.substring(0, 50),
                    recommendation: 'BLOQUEIO IMEDIATO - Verificar atividade do usuário',
                    timestamp: new Date().toISOString(),
                    blockImmediately: true
                }
            });
        }

        return null;
    }

    /**
     * Detecta acessos não autorizados em massa
     */
    static detectUnauthorizedAccessSpike(ip) {
        const key = `unauthorized_${ip}`;
        const now = Date.now();
        const timeWindow = 10 * 60 * 1000; // 10 minutos

        let attempts = this.attemptCache.get(key) || [];
        attempts = attempts.filter(time => now - time < timeWindow);
        attempts.push(now);

        this.attemptCache.set(key, attempts);

        if (attempts.length >= 10) {
            return this.createAlert({
                type: this.ALERT_TYPES.UNAUTHORIZED_ACCESS,
                severity: this.SEVERITY.HIGH,
                description: `${attempts.length} acessos não autorizados (401/403) do IP ${ip}`,
                sourceIp: ip,
                details: {
                    attemptCount: attempts.length,
                    timeWindow: '10 minutos',
                    recommendation: 'Considerar bloqueio temporário de IP',
                    blockRecommended: attempts.length >= 15
                }
            });
        }

        return null;
    }

    /**
     * Detecta anomalia geográfica (login de localização inesperada)
     */
    static detectGeographicAnomaly(userId, currentIp, previousIp, currentLocation, previousLocation) {
        if (!previousIp || currentIp === previousIp) {
            return null;
        }

        // Simples: IPs diferentes indicam localização diferente
        return this.createAlert({
            type: this.ALERT_TYPES.GEOGRAPHIC_ANOMALY,
            severity: this.SEVERITY.MEDIUM,
            description: `Login de novo IP detectado para usuário`,
            userId: userId,
            details: {
                previousIp: previousIp,
                currentIp: currentIp,
                currentLocation: currentLocation || 'desconhecida',
                previousLocation: previousLocation || 'desconhecida',
                recommendation: 'Verificar se é atividade legítima',
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Detecta tentativa de escalação de privilégio
     */
    static detectPrivilegeEscalation(userId, currentRole, attemptedRole, ip) {
        if (currentRole === attemptedRole) {
            return null;
        }

        return this.createAlert({
            type: this.ALERT_TYPES.PRIVILEGE_ESCALATION,
            severity: this.SEVERITY.HIGH,
            description: `Tentativa de escalação de privilégio detectada`,
            userId: userId,
            sourceIp: ip,
            details: {
                currentRole: currentRole,
                attemptedRole: attemptedRole,
                recommendation: 'Revisar acesso do usuário imediatamente',
                blockRecommended: true,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Detecta tentativa de exfiltração de dados
     */
    static detectDataExfiltration(userId, ip, requestCount, dataSize) {
        // 50+ requisições em 1 minuto = suspeito
        if (requestCount >= 50 || dataSize > 100 * 1024 * 1024) {
            // > 100MB
            return this.createAlert({
                type: this.ALERT_TYPES.DATA_EXFILTRATION,
                severity: this.SEVERITY.CRITICAL,
                description: `Possível exfiltração de dados detectada`,
                userId: userId,
                sourceIp: ip,
                details: {
                    requestCount: requestCount,
                    dataSizeMB: (dataSize / 1024 / 1024).toFixed(2),
                    recommendation: 'BLOQUEIO IMEDIATO - Investigar conta do usuário',
                    blockImmediately: true,
                    timestamp: new Date().toISOString()
                }
            });
        }

        return null;
    }

    /**
     * Detecta padrão de token inválido repetido
     */
    static detectTokenAbuse(ip, tokenError) {
        const key = `token_${ip}`;
        const now = Date.now();
        const timeWindow = 5 * 60 * 1000;

        let attempts = this.attemptCache.get(key) || [];
        attempts = attempts.filter(time => now - time < timeWindow);
        attempts.push(now);

        this.attemptCache.set(key, attempts);

        if (attempts.length >= 8) {
            return this.createAlert({
                type: this.ALERT_TYPES.TOKEN_ABUSE,
                severity: this.SEVERITY.MEDIUM,
                description: `Padrão repetido de token inválido/expirado do IP ${ip}`,
                sourceIp: ip,
                details: {
                    attemptCount: attempts.length,
                    errorType: tokenError,
                    recommendation: 'Possível ferramenta de teste, considerar bloqueio',
                    timestamp: new Date().toISOString()
                }
            });
        }

        return null;
    }

    /**
     * Cria um alerta de segurança
     */
    static createAlert(alertData) {
        const alert = {
            id: `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: alertData.type,
            severity: alertData.severity,
            description: alertData.description,
            sourceIp: alertData.sourceIp || null,
            userId: alertData.userId || null,
            details: alertData.details || {},
            timestamp: new Date().toISOString(),
            status: 'active',
            notified: false,
            notifiedAdmins: []
        };

        // Log do alerta
        logger.warn('SECURITY_ALERT', alert);

        // Salvar alerta no banco
        this.storeAlert(alert);

        // Notificar admin técnico
        this.notifyTechnicalAdmin(alert);

        return alert;
    }

    /**
     * Salva alerta no banco de dados
     */
    static async storeAlert(alert) {
        try {
            // TODO: Implementar salvamento em DB
            // await knex('security_alerts').insert(alert);
            logger.info('Alert stored', { alertId: alert.id });
        } catch (error) {
            logger.error('Error storing alert', { error: error.message });
        }
    }

    /**
     * Notifica admin técnico
     */
    static async notifyTechnicalAdmin(alert) {
        try {
            // TODO: Implementar notificação
            // - WebSocket para notificação em tempo real
            // - Email para alertas críticos
            // - SMS para críticos EXTREMOS

            if (alert.severity === this.SEVERITY.CRITICAL) {
                logger.error('CRITICAL_SECURITY_ALERT', {
                    alertId: alert.id,
                    type: alert.type,
                    description: alert.description,
                    needsImmediateAttention: true
                });

                // Em produção: enviar SMS / Email / Push notification
                // this.sendCriticalAlert(alert);
            }
        } catch (error) {
            logger.error('Error notifying admin', { error: error.message });
        }
    }

    /**
     * Lista alertas ativas
     */
    static getActiveAlerts(filters = {}) {
        // TODO: Implementar filtro em DB
        return {
            alerts: [],
            total: 0,
            filters: filters,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Limpa cache de tentativas
     */
    static clearAttemptCache(key) {
        this.attemptCache.delete(key);
    }

    /**
     * Limpa cache antigo (> 1 hora)
     */
    static cleanupOldCache() {
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hora

        for (const [key, attempts] of this.attemptCache.entries()) {
            const validAttempts = attempts.filter(time => now - time < maxAge);

            if (validAttempts.length === 0) {
                this.attemptCache.delete(key);
            } else {
                this.attemptCache.set(key, validAttempts);
            }
        }
    }

    /**
     * Estatísticas de segurança
     */
    static getSecurityStats() {
        return {
            totalAlerts: this.attemptCache.size,
            activeThreats: Array.from(this.attemptCache.keys()),
            lastCleanup: new Date().toISOString(),
            memoryUsage: JSON.stringify(this.attemptCache).length
        };
    }
}

// Limpar cache antigo a cada 15 minutos
setInterval(() => {
    SecurityAlertService.cleanupOldCache();
}, 15 * 60 * 1000);

module.exports = SecurityAlertService;
