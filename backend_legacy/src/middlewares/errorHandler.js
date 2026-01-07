const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    logger.error(err.stack);

    const status = err.status || 500;
    const message = err.message || 'Erro interno no servidor';

    // Hide stack trace in production
    const response = {
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    res.status(status).json(response);
};

module.exports = errorHandler;
