/**
 * Security Detection Middleware
 * Integra SecurityAlertService em pontos críticos da aplicação
 */

const SecurityAlertService = require('../services/securityAlertService');
const logger = require('../config/logger');

/**
 * Middleware para detectar brute force de login
 */
const detectLoginAnomalies = (req, res, next) => {
    // Intercepta login e detecta anomalias
    const originalJson = res.json;

    res.json = function(data) {
        if (req.path === '/api/auth/login') {
            const success = res.statusCode === 200;
            const ip = req.ip;
            const cpf = req.body?.cpf;

            // Detecta brute force
            const bruteForceAlert = SecurityAlertService.detectBruteForceLogin(
                ip, cpf, success, req.tenantId || req.user?.tenantId);
            if (bruteForceAlert) {
                logger.warn('BRUTE_FORCE_DETECTED', {
                    ip: ip,
                    attempts: bruteForceAlert.details.attemptCount,
                    severity: bruteForceAlert.severity
                });
            }
        }

        return originalJson.call(this, data);
    };

    next();
};

/**
 * Middleware para detectar anomalias de acesso não autorizado
 */
const detectAccessAnomalies = (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
        if (res.statusCode === 401 || res.statusCode === 403) {
            const ip = req.ip;
            const accessDeniedAlert = SecurityAlertService.detectUnauthorizedAccessSpike(
                ip, req.tenantId || req.user?.tenantId);

            if (accessDeniedAlert) {
                logger.warn('ACCESS_DENIED_SPIKE', {
                    ip: ip,
                    attempts: accessDeniedAlert.details.attemptCount,
                    severity: accessDeniedAlert.severity
                });
            }
        }

        return originalJson.call(this, data);
    };

    next();
};

/**
 * Middleware para detectar tentativas de XSS
 */
const detectXSSAnomalies = (req, res, next) => {
    const ip = req.ip;
    const userId = req.user?.id;

    // Padrões XSS comuns
    const xssPatterns = [
        /<script[^>]*>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi
    ];

    // Verifica em todos os inputs
    const allInputs = {
        ...req.body,
        ...req.query,
        ...req.params
    };

    for (const [key, value] of Object.entries(allInputs)) {
        if (typeof value === 'string') {
            for (const pattern of xssPatterns) {
                if (pattern.test(value)) {
                    const xssAlert = SecurityAlertService.detectXSSAttempt(
                        ip, userId, value, req.tenantId || req.user?.tenantId);
                    logger.warn('XSS_ATTEMPT_DETECTED', {
                        ip: ip,
                        userId: userId,
                        field: key,
                        severity: xssAlert.severity
                    });
                    break;
                }
            }
        }
    }

    next();
};

/**
 * Middleware para detectar tentativas de SQL injection
 */
const detectSQLInjectionAnomalies = (req, res, next) => {
    const ip = req.ip;
    const userId = req.user?.id;

    const sqlPatterns = [
        /(\sunion\s|\sOR\s|--|;)/gi,
        /('|")\s*(OR|AND)\s*('|")/gi,
        /(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER)\s+/gi,
        /(\*\s*FROM\s*|\*\s*JOIN)/gi
    ];

    const allInputs = {
        ...req.body,
        ...req.query,
        ...req.params
    };

    for (const [key, value] of Object.entries(allInputs)) {
        if (typeof value === 'string') {
            for (const pattern of sqlPatterns) {
                if (pattern.test(value)) {
                    const sqlAlert = SecurityAlertService.detectSQLInjection(
                        ip, userId, key, value, req.tenantId || req.user?.tenantId);
                    logger.error('SQL_INJECTION_ATTEMPT', {
                        ip: ip,
                        userId: userId,
                        parameter: key,
                        severity: sqlAlert.severity,
                        blockImmediately: true
                    });

                    // Bloqueia requisição imediatamente
                    return res.status(400).json({
                        error: 'Invalid request',
                        message: 'Requisição bloqueada por padrão suspeito'
                    });
                }
            }
        }
    }

    next();
};

/**
 * Middleware para detectar token abuse
 */
const detectTokenAnomalies = (req, res, next) => {
    const ip = req.ip;

    const originalJson = res.json;

    res.json = function(data) {
        if (res.statusCode === 401 && (data?.error === 'Invalid token' || data?.error === 'Token expired')) {
            const tokenAlert = SecurityAlertService.detectTokenAbuse(
                ip, data.error, req.tenantId || req.user?.tenantId);

            if (tokenAlert) {
                logger.warn('TOKEN_ABUSE_PATTERN', {
                    ip: ip,
                    attempts: tokenAlert.details.attemptCount,
                    errorType: data.error
                });
            }
        }

        return originalJson.call(this, data);
    };

    next();
};

module.exports = {
    detectLoginAnomalies,
    detectAccessAnomalies,
    detectXSSAnomalies,
    detectSQLInjectionAnomalies,
    detectTokenAnomalies
};
