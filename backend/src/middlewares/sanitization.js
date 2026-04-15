const xss = require('xss');
const logger = require('../config/logger');

/**
 * Sanitizeador recursivo de objetos
 * Remove scripts XSS de strings mantendo dados válidos
 */
function sanitizeObject(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'string') {
        // Sanitizar strings removendo scripts
        return xss(obj, {
            whiteList: {},        // Sem tags HTML permitidas
            stripIgnoredTag: true, // Remove tags ignoradas
            stripLeadingAndTrailingWhitespace: false
        });
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    }

    return obj;
}

/**
 * Middleware global de sanitização XSS
 * Sanitiza req.body, req.query e req.params
 */
const sanitizationMiddleware = (req, res, next) => {
    try {
        // Sanitizar body (POST/PUT/PATCH)
        if (req.body && Object.keys(req.body).length > 0) {
            const originalBody = JSON.stringify(req.body);
            req.body = sanitizeObject(req.body);
            
            // Log se houve mudanças (sinal de tentativa de XSS)
            if (JSON.stringify(req.body) !== originalBody) {
                logger.warn(`[SECURITY] XSS attempt detected in request body`, {
                    ip: req.ip,
                    path: req.path,
                    method: req.method,
                    userId: req.user?.id || 'anonymous'
                });
            }
        }

        // Sanitizar query params (GET/DELETE com params)
        if (req.query && Object.keys(req.query).length > 0) {
            const originalQuery = JSON.stringify(req.query);
            req.query = sanitizeObject(req.query);
            
            if (JSON.stringify(req.query) !== originalQuery) {
                logger.warn(`[SECURITY] XSS attempt detected in query params`, {
                    ip: req.ip,
                    path: req.path,
                    method: req.method,
                    userId: req.user?.id || 'anonymous'
                });
            }
        }

        // Sanitizar params de rota (:id, etc)
        if (req.params && Object.keys(req.params).length > 0) {
            const originalParams = JSON.stringify(req.params);
            req.params = sanitizeObject(req.params);
            
            if (JSON.stringify(req.params) !== originalParams) {
                logger.warn(`[SECURITY] XSS attempt detected in URL params`, {
                    ip: req.ip,
                    path: req.path,
                    method: req.method,
                    userId: req.user?.id || 'anonymous'
                });
            }
        }

        next();
    } catch (error) {
        logger.error('[SECURITY] Error in sanitization middleware', { error: error.message });
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { sanitizationMiddleware, sanitizeObject };
