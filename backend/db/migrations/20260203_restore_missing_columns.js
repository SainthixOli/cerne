
exports.up = async function (knex) {
    const hasProtocolo = await knex.schema.hasColumn('filiacoes', 'protocolo');
    const hasResponsavel = await knex.schema.hasColumn('filiacoes', 'responsavel_admin_id');
    const hasStatusAtendimento = await knex.schema.hasColumn('filiacoes', 'status_atendimento');

    return knex.schema.table('filiacoes', function (table) {
        // Idempotent restore for environments where columns already exist.
        if (!hasProtocolo) {
            table.string('protocolo').unique();
        }
        if (!hasResponsavel) {
            table.string('responsavel_admin_id').references('profiles.id');
        }
        if (!hasStatusAtendimento) {
            table.string('status_atendimento').defaultTo('aberto');
        }
    });
};

exports.down = function (knex) {
    return knex.schema.table('filiacoes', function (table) {
        table.dropColumn('protocolo');
        table.dropColumn('responsavel_admin_id');
        table.dropColumn('status_atendimento');
    });
};
