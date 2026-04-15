const logger = require('./logger');

/**
 * Audit Logger - Sistema centralizado de logs de segurança
 * Registra: login attempts, auth failures, data changes, uploads
 */

class AuditLogger {
    /**
     * Log de tentativa de login
     */
    static loginAttempt(cpf, ip, userAgent, success = false, reason = null) {
        const logData = {
            action: 'LOGIN_ATTEMPT',
            cpf: this._maskCPF(cpf),
            ip,
            userAgent: this._truncate(userAgent, 100),
            success,
            timestamp: new Date().toISOString()
        };

        if (reason) logData.reason = reason;

        logger.info('[SECURITY:AUTH] Login attempt', logData);
    }

    /**
     * Log de autenticação falha
     */
    static authFailure(userId, ip, reason, endpoint = null) {
        logger.warn('[SECURITY:AUTH] Authentication failure', {
            action: 'AUTH_FAILURE',
            userId: userId || 'unknown',
            ip,
            reason,
            endpoint,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Log de token inválido/expirado
     */
    static invalidToken(token, ip, reason = 'Invalid token') {
        logger.warn('[SECURITY:AUTH] Invalid token', {
            action: 'INVALID_TOKEN',
            tokenLength: token ? token.length : 0,
            ip,
            reason,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Log de alteração de dados sensíveis
     */
    static dataSensitiveChange(userId, action, entityType, entityId, changes, ip) {
        logger.info('[SECURITY:DATA_CHANGE] Sensitive data modification', {
            action: `DATA_${action.toUpperCase()}`,
            userId,
            entityType,
            entityId,
            changedFields: Object.keys(changes || {}),
            changeCount: Object.keys(changes || {}).length,
            ip,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Log de upload de arquivo
     */
    static fileUpload(userId, fileName, fileSize, mimeType, ip, success = true, error = null) {
        const logData = {
            action: 'FILE_UPLOAD',
            userId,
            fileName: this._sanitizeFileName(fileName),
            fileSize,
            mimeType,
            ip,
            success,
            timestamp: new Date().toISOString()
        };

        if (error) logData.error = error;

        logger.info('[SECURITY:FILE] File upload', logData);
    }

    /**
     * Log de operação de risco (aprovação, rejeição, etc)
     */
    static sensitiveOperation(userId, operation, targetId, details, ip) {
        logger.info('[SECURITY:OPERATION] Sensitive operation', {
            action: operation.toUpperCase(),
            userId,
            targetId,
            details,
            ip,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Log de acesso negado
     */
    static accessDenied(userId, endpoint, reason, ip) {
        logger.warn('[SECURITY:ACCESS] Access denied', {
            action: 'ACCESS_DENIED',
            userId: userId || 'unknown',
            endpoint,
            reason,
            ip,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Log de mudança de senha
     */
    static passwordChange(userId, ip, success = true, reason = null) {
        const logData = {
            action: 'PASSWORD_CHANGE',
            userId,
            ip,
            success,
            timestamp: new Date().toISOString()
        };

        if (reason) logData.reason = reason;

        logger.info('[SECURITY:PASSWORD] Password change', logData);
    }

    /**
     * Log de MFA action (quando implementado)
     */
    static mfaAction(userId, action, ip, success = true, method = null) {
        const logData = {
            action: `MFA_${action.toUpperCase()}`,
            userId,
            ip,
            success,
            timestamp: new Date().toISOString()
        };

        if (method) logData.method = method;

        logger.info('[SECURITY:MFA] MFA action', logData);
    }

    /**
     * Máscara CPF para logs (mostra apenas primeiros e últimos 2 dígitos)
     */
    static _maskCPF(cpf) {
        if (!cpf || cpf.length < 4) return '***';
        return cpf.substring(0, 3) + '*'.repeat(cpf.length - 5) + cpf.substring(cpf.length - 2);
    }

    /**
     * Trunca strings longas para evitar logs gigantes
     */
    static _truncate(str, maxLength = 100) {
        if (!str) return null;
        if (typeof str !== 'string') return String(str).substring(0, maxLength);
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }

    /**
     * Sanitiza nome de arquivo para logs
     */
    static _sanitizeFileName(fileName) {
        if (!fileName) return 'unknown';
        // Remove path traversal attempts
        return fileName.split('/').pop().split('\\').pop();
    }
}

module.exports = AuditLogger;
