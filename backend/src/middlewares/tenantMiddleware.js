/**
 * 🏢 TENANT MIDDLEWARE
 * Extrai e injeta tenant_id em todas as requisições autenticadas
 * 
 * Camada 1 de segurança multi-tenant: JWT → tenantMiddleware → tenantValidation
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Extrai tenant_id do JWT e injeta em req.user e req.tenantId
 * Deve ser usado APÓS o middleware de autenticação
 * 
 * Exemplo:
 *   router.get('/affiliations', authenticate, tenantMiddleware, affiliationController.getAll);
 */
const tenantMiddleware = (req, res, next) => {
    try {
        // Validar que req.user existe (foi criado pelo authenticate middleware)
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'req.user not found - execute authenticate middleware first'
            });
        }

        // Extrair tenantId do JWT payload
        // PADRÃO: JWT deve conter tenantId
        const tenantId = req.user.tenantId || req.user.tenant_id;

        if (!tenantId) {
            logger.warn(`User ${req.user.id} has no tenantId in JWT`, { userId: req.user.id });
            return res.status(403).json({ 
                error: 'Tenant not assigned',
                message: 'User does not have a tenant assigned'
            });
        }

        // Injetar tenantId em req para fácil acesso
        req.tenantId = tenantId;
        req.userId = req.user.id;
        req.userRole = req.user.role;

        // Log
        logger.debug('Tenant middleware executed', {
            userId: req.userId,
            tenantId: req.tenantId,
            role: req.userRole
        });

        next();
    } catch (error) {
        logger.error('Error in tenantMiddleware', { error: error.message });
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Validar que tenantId está presente e é válido
 * Usa como safeguard adicional
 */
const validateTenantIdPresent = (req, res, next) => {
    if (!req.tenantId) {
        logger.warn('Requisição sem tenantId', {
            path: req.path,
            userId: req.user?.id
        });
        return res.status(403).json({ 
            error: 'Tenant ID missing',
            message: 'Request must include valid tenant ID'
        });
    }
    
    // Garantir que é número inteiro
    if (!Number.isInteger(req.tenantId)) {
        logger.warn('tenantId inválido', {
            tenantId: req.tenantId,
            type: typeof req.tenantId
        });
        return res.status(400).json({ 
            error: 'Invalid tenant ID',
            message: 'Tenant ID must be an integer'
        });
    }

    next();
};

module.exports = {
    tenantMiddleware,
    validateTenantIdPresent
};
