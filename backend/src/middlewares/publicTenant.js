const { requireActiveTenantBySlug, TenantContextError } = require('../services/tenantContext');
const { runTenantRequest } = require('./tenantDatabaseContext');

async function publicTenant(req, res, next) {
    try {
        const tenant = await requireActiveTenantBySlug(req.get('X-Tenant-Slug'));
        if (req.user && req.user.tenantId !== tenant.id) {
            return res.status(403).json({ error: 'Tenant incompatível' });
        }
        req.tenantId = tenant.id;
        req.tenant = tenant;
        return runTenantRequest(tenant.id, req, res, next);
    } catch (error) {
        if (error instanceof TenantContextError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        return next(error);
    }
}

module.exports = publicTenant;
