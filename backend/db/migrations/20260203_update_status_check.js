
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // SQLite doesn't support dropping constraints or altering columns easily.
    // We must recreate the table.

    // 1. Rename existing table
    await knex.schema.renameTable('filiacoes', 'filiacoes_old');

    // 2. Create new table (without the restrictive CHECK constraint, or with a broader one)
    // Note: If the original table had a CHECK constraint in raw SQL, Knex createTable won't add it unless we use raw SQL.
    // We will define it cleanly here.
    await knex.schema.createTable('filiacoes', function (table) {
        table.increments('id');
        // Re-establish FKs
        table.string('user_id').references('profiles.id').onDelete('CASCADE');
        table.datetime('data_solicitacao').defaultTo(knex.fn.now());
        table.datetime('data_aprovacao');
        table.string('status').notNullable().defaultTo('em_processamento');
        // New constraint note: we just don't add the raw SQL check, allowing any string. 
        // Or we could add a broader check if we wanted strictness.

        table.string('aprovado_por_admin_id').references('profiles.id').onDelete('SET NULL');
        table.text('observacoes_admin');
    });

    // 3. Copy data
    await knex.raw('INSERT INTO filiacoes (id, user_id, data_solicitacao, data_aprovacao, status, aprovado_por_admin_id, observacoes_admin) SELECT id, user_id, data_solicitacao, data_aprovacao, status, aprovado_por_admin_id, observacoes_admin FROM filiacoes_old');

    // 4. Drop old table
    await knex.schema.dropTable('filiacoes_old');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // Reverse the process if needed, but in this cases, going back to a restricted constraint might violate allow data.
    // For simplicity in this fix, we won't strictly enforce the old constraint on rollback unless required.
    // If strict rollback is needed:
    /*
    await knex.schema.renameTable('filiacoes', 'filiacoes_unrestricted');
    await knex.schema.createTable('filiacoes', function (table) {
        // ... definition with strict check
    });
    // Copy data...
    */
};
