const logger = require('../config/logger');

/**
 * Delivery remains a no-op until an external email provider is configured.
 * Passwords, recipient addresses and reset tokens must never be written to logs.
 */
exports.sendPasswordEmail = async () => {
    logger.warn('[EMAIL] Password email was not delivered because no provider is configured');
    return true;
};

exports.sendResetPasswordEmail = async () => {
    logger.warn('[EMAIL] Password reset email was not delivered because no provider is configured');
    return true;
};
