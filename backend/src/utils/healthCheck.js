const knex = require('../config/connection');
const logger = require('../config/logger');

async function checkReadiness() {
    try {
        await knex.raw('SELECT 1');
        return { ready: true };
    } catch (error) {
        logger.error('[System] Readiness check failed', { code: error.code });
        return { ready: false, code: 'DATABASE_UNAVAILABLE' };
    }
}

async function runHealthCheck() {
    logger.info('[System] Running startup readiness check');
    const result = await checkReadiness();
    if (!result.ready) throw new Error('Falha ao conectar ao PostgreSQL');
    logger.info('[System] Database connection verified');
    return true;
}

module.exports = { checkReadiness, runHealthCheck };
