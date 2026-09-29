const crypto = require('crypto');
const uploadGrantRepository = require('../repositories/uploadGrantRepository');

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

async function issue(db, affiliationId, tenantId) {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const record = { token_hash: hash(token), filiacao_id: affiliationId, tenant_id: tenantId, expires_at: expiresAt };
    await uploadGrantRepository.create(record, db);
    return token;
}

async function requireUploadGrant(req, res, next) {
    const token = req.get('X-Upload-Token');
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
        return res.status(403).json({ error: 'Autorização de upload inválida' });
    }
    try {
        const tokenHash = hash(token);
        const grant = await uploadGrantRepository.findUsable(tokenHash, req.tenantId);
        if (!grant) return res.status(403).json({ error: 'Autorização de upload inválida' });
        req.uploadGrant = { tokenHash, affiliationId: grant.filiacao_id, userId: grant.user_id };
        return next();
    } catch (error) {
        return next(error);
    }
}

module.exports = { issue, requireUploadGrant };
