const VALID_ROLES = new Set(['professor', 'admin', 'super_admin', 'system_manager']);
const { sendError } = require('../utils/apiResponse');

// Public endpoints declare their access policy just as protected endpoints do.
const allowPublic = (req, res, next) => next();
allowPublic.accessPolicy = 'public';

const requireRole = (...roles) => {
    if (roles.length === 0 || roles.some((role) => !VALID_ROLES.has(role))) {
        throw new Error('requireRole requires at least one valid role');
    }

    const allowedRoles = Object.freeze([...new Set(roles)]);
    const authorizeRole = (req, res, next) => {
        if (!req.user) return sendError(res, 401, 'Não autenticado', 'UNAUTHENTICATED');
        if (!allowedRoles.includes(req.user.role)) {
            return sendError(res, 403, 'Acesso negado', 'FORBIDDEN');
        }
        return next();
    };

    authorizeRole.accessPolicy = 'roles';
    authorizeRole.allowedRoles = allowedRoles;
    return authorizeRole;
};

module.exports = { requireRole, allowPublic };
