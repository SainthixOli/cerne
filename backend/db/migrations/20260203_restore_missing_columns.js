
exports.up = function (knex) {
    return knex.schema.table('filiacoes', function (table) {
        // Restore columns lost during table recreation
        table.string('protocolo').unique();
        table.string('responsavel_admin_id').references('profiles.id');
        table.string('status_atendimento').defaultTo('aberto');
    });
};

exports.down = function (knex) {
    return knex.schema.table('filiacoes', function (table) {
        table.dropColumn('protocolo');
        table.dropColumn('responsavel_admin_id');
        table.dropColumn('status_atendimento');
    });
};
