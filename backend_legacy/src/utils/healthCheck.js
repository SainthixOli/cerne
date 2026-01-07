const knex = require('../config/connection');
const logger = require('../config/logger');

async function runHealthCheck() {
    logger.info('[System] Running startup health check...');

    try {
        // 1. Check DB Connection
        await knex.raw('SELECT 1');
        logger.info('[System] Database connection verified.');

        return true;
    } catch (error) {
        logger.error('[System] Health check FAILED:', error);
        return false;
    }
}

module.exports = { runHealthCheck };
