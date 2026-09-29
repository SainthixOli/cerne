const crypto = require('crypto');
const knex = require('../config/connection');

function encryptionKey() {
    const secret = process.env.OUTBOX_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
    if (!secret) throw new Error('OUTBOX_ENCRYPTION_KEY não configurada');
    return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(payload) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decrypt(value) {
    const data = Buffer.from(value, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8'));
}

async function enqueue({ tenantId, eventType, payload, transaction }) {
    const db = transaction || knex;
    const [row] = await db('delivery_outbox').insert({
        tenant_id: tenantId,
        event_type: eventType,
        encrypted_payload: encrypt(payload)
    }).returning('id');
    return row.id;
}

module.exports = { enqueue, decrypt };
