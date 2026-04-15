const AuditLogger = require('../config/auditLogger');

/**
 * Middleware para registrar acessos negados (401, 403)
 * Intercepta respostas de erro de autenticação/autorização
 */
const auditAccessDeniedMiddleware = (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
        // Registrar 401 (Unauthorized) e 403 (Forbidden)
        if (res.statusCode === 401) {
            AuditLogger.authFailure(
                req.user?.id || 'unknown',
                req.ip,
                data.error || 'Unauthorized',
                req.path
            );
        }

        if (res.statusCode === 403) {
            AuditLogger.accessDenied(
                req.user?.id || 'unknown',
                req.path,
                data.error || 'Forbidden',
                req.ip
            );
        }

        return originalJson(data);
    };

    next();
};

module.exports = { auditAccessDeniedMiddleware };
