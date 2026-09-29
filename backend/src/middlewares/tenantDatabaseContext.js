const knex = require('../config/connection');

class RequestRollback extends Error {}

async function runTenantRequest(tenantId, req, res, next) {
    const originalEnd = res.end.bind(res);
    let pendingEnd;
    let resolveController;
    let rejectController;

    res.end = (...args) => {
        if (!pendingEnd) {
            pendingEnd = args;
            if (res.statusCode >= 400) rejectController(new RequestRollback());
            else resolveController();
        }
        return res;
    };

    try {
        await knex.withTenantTransaction(tenantId, () => new Promise((resolve, reject) => {
            resolveController = resolve;
            rejectController = reject;
            try {
                next();
            } catch (error) {
                reject(error);
            }
        }));
    } catch (error) {
        if (!(error instanceof RequestRollback)) {
            res.end = originalEnd;
            if (!res.headersSent) return next(error);
            return;
        }
    }

    res.end = originalEnd;
    if (pendingEnd) {
        originalEnd(...pendingEnd);
    }
}

module.exports = { runTenantRequest };
