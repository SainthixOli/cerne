/**
 * 🛡️ TENANT SECURITY MIDDLEWARE
 * Camada 3 de segurança: Auditoria, rate limiting, e proteção por tenant
 */

const logger = require('../config/logger');

/**
 * Auditoria de ações sensíveis por tenant
 * Registra quem fez o quê, quando, de onde
 */
const auditTenantAction = (actionType, descriptionFn) => {
    return async (req, res, next) => {
        try {
            const { getDb } = require('../config/database');
            const db = await getDb();

            // Calcular description se for função
            let description = descriptionFn;
            if (typeof descriptionFn === 'function') {
                description = descriptionFn(req);
            }

            // Injetar auditData em req para uso posterior
            req.auditData = {
                actionType,
                description,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get('user-agent'),
                timestamp: new Date()
            };

            // Executar próximo middleware/controller
            const originalSend = res.send;
            res.send = function(data) {
                // Após a resposta, fazer log
                logTenantAction(req, res, req.auditData).catch(err => {
                    logger.error('Error logging tenant action', { error: err.message });
                });
                return originalSend.call(this, data);
            };

            next();
        } catch (error) {
            logger.error('Error in auditTenantAction', { error: error.message });
            next(); // Continuar mesmo com erro no audit
        }
    };
};

/**
 * Função que realmente faz o log em banco
 */
async function logTenantAction(req, res, auditData) {
    try {
        if (res.statusCode < 400) { // Apenas ações bem-sucedidas
            const { getDb } = require('../config/database');
            const db = await getDb();

            const query = `
                INSERT INTO audit_logs 
                (tenant_id, admin_id, action_type, target_id, details, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            await db.run(query, [
                req.tenantId,
                req.userId,
                auditData.actionType,
                req.params.id || null,
                auditData.description,
                auditData.ip_address,
                auditData.user_agent
            ]);

            logger.info('Action logged for audit', {
                tenantId: req.tenantId,
                userId: req.userId,
                action: auditData.actionType
            });
        }
    } catch (error) {
        logger.error('Error writing to audit_logs', { error: error.message });
    }
}

/**
 * Rate limiting por tenant
 * Limita requisições por tenant, não por IP global
 */
const tenantRateLimit = (maxRequests = 100, windowMs = 60000) => {
    const tenantRequests = new Map(); // { tenantId: { count, resetTime } }

    return (req, res, next) => {
        try {
            const tenantId = req.tenantId;
            const now = Date.now();

            if (!tenantRequests.has(tenantId)) {
                tenantRequests.set(tenantId, {
                    count: 0,
                    resetTime: now + windowMs
                });
            }

            const tenantData = tenantRequests.get(tenantId);

            // Reset se a janela expirou
            if (now > tenantData.resetTime) {
                tenantData.count = 0;
                tenantData.resetTime = now + windowMs;
            }

            tenantData.count++;

            // Adicionar headers
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - tenantData.count));
            res.setHeader('X-RateLimit-Reset', tenantData.resetTime);

            if (tenantData.count > maxRequests) {
                logger.warn('Tenant rate limit exceeded', {
                    tenantId,
                    count: tenantData.count,
                    maxRequests
                });

                return res.status(429).json({
                    error: 'Too many requests',
                    message: `Rate limit of ${maxRequests} requests per ${windowMs / 1000} seconds exceeded`,
                    retryAfter: Math.ceil((tenantData.resetTime - now) / 1000)
                });
            }

            next();
        } catch (error) {
            logger.error('Error in tenantRateLimit', { error: error.message });
            next(); // Continuar mesmo com erro
        }
    };
};

/**
 * Detectar comportamento suspeito dentro de um tenant
 * Ex: Múltiplas tentativas de delete, acesso a admin endpoints com role errado
 */
const detectSuspiciousActivity = (req, res, next) => {
    try {
        // Validações de segurança
        const suspiciousPatterns = [];

        // 1. DELETE sem confirmação dupla?
        if (req.method === 'DELETE' && !req.headers['x-confirm-delete']) {
            suspiciousPatterns.push('DELETE without confirmation header');
        }

        // 2. Acesso a admin endpoints sem role admin?
        if (req.path.includes('/admin') && req.userRole !== 'admin') {
            logger.warn('Non-admin accessing admin endpoint', {
                tenantId: req.tenantId,
                userId: req.userId,
                role: req.userRole,
                path: req.path
            });
            
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to access this endpoint'
            });
        }

        // 3. Modificar dados do outro usuário?
        if ((req.method === 'PUT' || req.method === 'PATCH') && req.body.user_id) {
            if (req.body.user_id !== req.userId && req.userRole !== 'admin') {
                logger.warn('User attempting to modify other user data', {
                    tenantId: req.tenantId,
                    userId: req.userId,
                    targetUserId: req.body.user_id
                });

                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only modify your own data'
                });
            }
        }

        if (suspiciousPatterns.length > 0) {
            logger.warn('Suspicious activity detected', {
                tenantId: req.tenantId,
                userId: req.userId,
                patterns: suspiciousPatterns
            });
        }

        next();
    } catch (error) {
        logger.error('Error in detectSuspiciousActivity', { error: error.message });
        next(); // Continuar mesmo com erro
    }
};

module.exports = {
    auditTenantAction,
    tenantRateLimit,
    detectSuspiciousActivity
};
