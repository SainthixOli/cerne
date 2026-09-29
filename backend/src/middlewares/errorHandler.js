const logger = require('../config/logger');
const { sendError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, _next) => {
    const status = Number(err.statusCode || err.status) || 500;
    logger.error('Request failed', {
        status,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        error: err
    });
    const publicMessage = status < 500 && err.expose ? err.message : undefined;
    return sendError(res, status, publicMessage, status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
};

module.exports = errorHandler;
