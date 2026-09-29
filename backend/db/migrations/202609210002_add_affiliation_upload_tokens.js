exports.up = async (knex) => {
    await knex.schema.createTable('affiliation_upload_tokens', (table) => {
        table.string('token_hash', 64).primary();
        table.integer('filiacao_id').notNullable().references('id').inTable('filiacoes');
        table.integer('tenant_id').notNullable().references('id').inTable('tenants');
        table.timestamp('expires_at').notNullable();
        table.timestamp('used_at').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index(['filiacao_id', 'tenant_id']);
    });
};

exports.down = async (knex) => knex.schema.dropTableIfExists('affiliation_upload_tokens');
