/**
 * Compatibility bridge for the historical SQLite table rebuild that follows.
 * This is intentionally additive: already-executed migrations are not edited.
 */
exports.up = async function (knex) {
    if (knex.client.config.client !== 'pg') return;

    for (const tableName of ['documentos', 'filiation_chat']) {
        const constraints = await knex.raw(`
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = ?::regclass
              AND contype = 'f'
              AND confrelid = 'filiacoes'::regclass
        `, [tableName]);

        for (const { conname } of constraints.rows) {
            await knex.raw('ALTER TABLE ?? DROP CONSTRAINT ??', [tableName, conname]);
        }
    }

    await knex.raw('ALTER SEQUENCE IF EXISTS filiacoes_id_seq RENAME TO filiacoes_old_id_seq');
};

exports.down = async function (knex) {
    if (knex.client.config.client !== 'pg') return;

    // Two historical down migrations both remove these columns. Recreate them
    // between those migrations so the older rollback remains deterministic.
    const missing = [];
    for (const column of ['protocolo', 'responsavel_admin_id', 'status_atendimento']) {
        if (!await knex.schema.hasColumn('filiacoes', column)) missing.push(column);
    }
    if (missing.length === 0) return;

    await knex.schema.alterTable('filiacoes', (table) => {
        if (missing.includes('protocolo')) table.string('protocolo');
        if (missing.includes('responsavel_admin_id')) table.string('responsavel_admin_id');
        if (missing.includes('status_atendimento')) table.string('status_atendimento');
    });
};
