const { withAuditedGlobalTransaction } = require('../config/globalConnection');
const emailService = require('../services/emailService');
const { decrypt } = require('../services/outboxService');
const logger = require('../config/logger');

const handlers = {
    PASSWORD_CREATED: ({ recipient, temporaryPassword }) =>
        emailService.sendPasswordEmail(recipient, temporaryPassword),
    PASSWORD_RESET: ({ recipient, resetToken }) =>
        emailService.sendResetPasswordEmail(recipient, resetToken),
    NOTIFICATION_APPROVED: async () => true
};

async function claimBatch(limit = 10) {
    return withAuditedGlobalTransaction({ actorId: 'outbox-worker', reason: 'delivery-dispatch' }, async (trx) => {
        const rows = await trx('delivery_outbox')
            .where((builder) => builder
                .where((pending) => pending.where({ status: 'pending' }).where('available_at', '<=', trx.fn.now()))
                .orWhere((stale) => stale.where({ status: 'processing' })
                    .where('locked_at', '<', trx.raw("CURRENT_TIMESTAMP - INTERVAL '10 minutes'"))))
            .orderBy('id')
            .limit(limit)
            .forUpdate()
            .skipLocked();
        if (rows.length) {
            await trx('delivery_outbox').whereIn('id', rows.map((row) => row.id)).update({
                status: 'processing', locked_at: trx.fn.now(), attempts: trx.raw('attempts + 1')
            });
        }
        return rows;
    });
}

async function finish(id, error, attempts = 0) {
    const exhausted = error && attempts >= 10;
    return withAuditedGlobalTransaction({ actorId: 'outbox-worker', reason: 'delivery-result' }, (trx) =>
        trx('delivery_outbox').where({ id }).update(error ? {
            status: exhausted ? 'failed' : 'pending',
            locked_at: null,
            available_at: exhausted ? trx.fn.now() : trx.raw("CURRENT_TIMESTAMP + INTERVAL '5 minutes'"),
            last_error_code: error.code || 'DELIVERY_FAILED'
        } : {
            status: 'processed', processed_at: trx.fn.now(), locked_at: null, last_error_code: null
        }));
}

async function processBatch() {
    const rows = await claimBatch();
    for (const row of rows) {
        try {
            const handler = handlers[row.event_type];
            if (!handler) throw Object.assign(new Error('Unsupported outbox event'), { code: 'UNSUPPORTED_EVENT' });
            await handler(decrypt(row.encrypted_payload));
            await finish(row.id);
        } catch (error) {
            logger.error('[OUTBOX] Delivery failed', { eventType: row.event_type, code: error.code || 'DELIVERY_FAILED' });
            await finish(row.id, error, row.attempts + 1);
        }
    }
    return rows.length;
}

function startOutboxWorker() {
    if (process.env.OUTBOX_WORKER_ENABLED !== 'true') return null;
    const interval = setInterval(() => processBatch().catch((error) =>
        logger.error('[OUTBOX] Worker cycle failed', { code: error.code || 'WORKER_FAILED' })), 5000);
    interval.unref();
    processBatch().catch((error) => logger.error('[OUTBOX] Initial cycle failed', { code: error.code || 'WORKER_FAILED' }));
    return interval;
}

module.exports = { processBatch, startOutboxWorker };
