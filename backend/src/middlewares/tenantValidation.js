/**
 * 🔐 TENANT VALIDATION MIDDLEWARE
 * Valida que o recurso pertence ao tenant do usuário
 * 
 * Camada 2 de segurança multi-tenant: Isolamento de dados
 * Previne acesso cross-tenant (IDOR multi-tenant)
 */

const logger = require('../config/logger');
const tenantRepository = require('../repositories/tenantRepository');

/**
 * Validação genérica: Verifica se um recurso pertence ao tenant
 * 
 * Uso:
 *   router.get('/affiliations/:id', 
 *     authenticate, 
 *     tenantMiddleware,
 *     validateResourceTenant('filiacoes', 'id', 'tenant_id'),
 *     affiliationController.getById
 *   );
 */
const validateResourceTenant = (tableName, paramName, dbTenantIdColumn = 'tenant_id') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[paramName];
            const userTenantId = req.tenantId;

            if (!resourceId) {
                return res.status(400).json({ 
                    error: 'Bad request',
                    message: `Missing ${paramName} parameter`
                });
            }

            // Buscar recurso com filtro tenant
            if (dbTenantIdColumn !== 'tenant_id') throw new TypeError('Coluna de tenant inválida');
            const resource = await tenantRepository.findResourceTenant(tableName, resourceId);

            if (!resource) {
                logger.warn('Resource not found', {
                    table: tableName,
                    resourceId,
                    userTenantId
                });
                return res.status(404).json({ 
                    error: 'Resource not found',
                    message: `${tableName} with id ${resourceId} not found`
                });
            }

            // Validar tenant
            if (resource.tenant_id !== userTenantId) {
                logger.warn('Cross-tenant access attempt BLOCKED', {
                    table: tableName,
                    resourceId,
                    userTenantId,
                    resourceTenantId: resource.tenant_id,
                    userId: req.userId
                });
                
                return res.status(403).json({ 
                    error: 'Access denied',
                    message: 'You do not have permission to access this resource',
                    details: 'The resource belongs to a different tenant'
                });
            }

            // Injetar recurso em req para uso posterior
            req.resourceTenantId = resource.tenant_id;

            next();
        } catch (error) {
            logger.error('Error in validateResourceTenant', { error: error.message });
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
};

/**
 * Middleware que garante que o usuário só acessa dados do seu tenant
 * para operações em massa (ex: GET /affiliations)
 */
const ensureTenantIsolation = (req, res, next) => {
    try {
        // Validar que req.tenantId está definido
        if (!req.tenantId) {
            logger.warn('Tenant isolation check failed: no tenantId', {
                path: req.path,
                userId: req.user?.id
            });
            return res.status(403).json({ 
                error: 'Access denied',
                message: 'Tenant ID not found in request context'
            });
        }

        // Validar que é um número inteiro
        if (!Number.isInteger(req.tenantId) || req.tenantId <= 0) {
            logger.warn('Invalid tenant ID', {
                tenantId: req.tenantId,
                type: typeof req.tenantId
            });
            return res.status(400).json({ 
                error: 'Invalid tenant ID',
                message: 'Tenant ID must be a positive integer'
            });
        }

        next();
    } catch (error) {
        logger.error('Error in ensureTenantIsolation', { error: error.message });
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Helper para validar que um array de recurso IDs pertencem ao tenant
 * Útil para bulk operations
 */
const validateResourcesOwnership = (tableName, idsParam = 'ids') => {
    return async (req, res, next) => {
        try {
            const ids = req.body[idsParam] || req.query[idsParam];
            const userTenantId = req.tenantId;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ 
                    error: 'Bad request',
                    message: `${idsParam} must be a non-empty array`
                });
            }

            // Verificar que TODOS os recursos pertencem ao tenant
            const total = await tenantRepository.countResourcesInTenant(tableName, ids, userTenantId);

            if (total !== ids.length) {
                logger.warn('Bulk operation: some resources do not belong to tenant', {
                    table: tableName,
                    requestedCount: ids.length,
                    foundCount: total,
                    userTenantId
                });
                
                return res.status(403).json({ 
                    error: 'Access denied',
                    message: `Not all ${tableName} belong to your tenant`
                });
            }

            next();
        } catch (error) {
            logger.error('Error in validateResourcesOwnership', { error: error.message });
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
};

module.exports = {
    validateResourceTenant,
    ensureTenantIsolation,
    validateResourcesOwnership
};
