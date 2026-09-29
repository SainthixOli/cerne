const knexFactory = require('knex');
const logger = require('./logger');

let globalConnection;

function connectionConfig() {
    if (!process.env.DB_GLOBAL_USER || !process.env.DB_GLOBAL_PASSWORD) {
        throw new Error('Contexto global não configurado');
    }
    return {
        client: 'pg',
        connection: {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT || 5432),
            database: process.env.DB_NAME,
            user: process.env.DB_GLOBAL_USER,
            password: process.env.DB_GLOBAL_PASSWORD,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
        },
        pool: { min: 0, max: 2 }
    };
}

function getGlobalConnection() {
    if (!globalConnection) globalConnection = knexFactory(connectionConfig());
    return globalConnection;
}

async function withAuditedGlobalTransaction({ actorId, reason }, callback) {
    if (!actorId || !reason) throw new Error('Contexto global exige ator e justificativa');
    logger.warn('GLOBAL_DATABASE_CONTEXT', { actorId, reason });
    return getGlobalConnection().transaction(async (trx) => {
        await trx.raw("SELECT set_config('app.global_actor_id', ?, true)", [String(actorId)]);
        await trx.raw("SELECT set_config('app.global_reason', ?, true)", [String(reason)]);
        return callback(trx);
    });
}

async function closeGlobalConnection() {
    if (globalConnection) await globalConnection.destroy();
    globalConnection = null;
}

module.exports = { withAuditedGlobalTransaction, closeGlobalConnection };
