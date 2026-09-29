const knex = require('../config/connection');

async function create(record, transaction) {
    return (transaction || knex)('affiliation_upload_tokens').insert(record);
}

async function findUsable(tokenHash, tenantId) {
    return knex('affiliation_upload_tokens as token')
        .join('filiacoes as affiliation', function joinAffiliation() {
            this.on('affiliation.id', '=', 'token.filiacao_id')
                .andOn('affiliation.tenant_id', '=', 'token.tenant_id');
        })
        .select('token.filiacao_id', 'affiliation.user_id')
        .where({
            'token.token_hash': tokenHash,
            'token.tenant_id': tenantId,
            'affiliation.status': 'em_processamento'
        })
        .whereNull('token.used_at')
        .where('token.expires_at', '>', knex.fn.now())
        .first();
}

module.exports = { create, findUsable };
