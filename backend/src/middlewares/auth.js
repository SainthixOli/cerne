const jwt = require('jsonwebtoken');
const { validateAuthenticatedAccount, TenantContextError } = require('../services/tenantContext');
const SECRET_KEY = process.env.JWT_SECRET;
const { sendError } = require('../utils/apiResponse');
const { getSessionToken } = require('../utils/sessionCookie');
if (!SECRET_KEY) throw new Error('JWT_SECRET missing in env');

async function resolveToken(token) {
    const claims = jwt.verify(token, SECRET_KEY);
    return validateAuthenticatedAccount(claims);
}

exports.authenticateToken = async (req, res, next) => {
    const token = req.get('Authorization')?.match(/^Bearer (\S+)$/)?.[1] || getSessionToken(req);
    if (!token) return sendError(res, 401, 'Não autenticado', 'UNAUTHENTICATED');
    try {
        req.user = await resolveToken(token);
        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof TenantContextError) {
            return sendError(res, 401, 'Não autenticado', 'UNAUTHENTICATED');
        }
        return next(error);
    }
};

exports.authenticateTokenOptional = async (req, res, next) => {
    const token = req.get('Authorization')?.match(/^Bearer (\S+)$/)?.[1] || getSessionToken(req);
    if (!token) {
        req.user = null;
        return next();
    }
    try {
        req.user = await resolveToken(token);
    } catch (error) {
        if (!(error instanceof jwt.JsonWebTokenError || error instanceof TenantContextError)) {
            return next(error);
        }
        req.user = null;
    }
    return next();
};
