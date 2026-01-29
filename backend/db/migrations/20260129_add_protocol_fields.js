
exports.up = function (knex) {
    return knex.schema.table('filiacoes', function (table) {
        table.string('protocolo').unique();
        table.string('responsavel_admin_id'); // UUID references profiles.id
        table.string('status_atendimento').defaultTo('aberto'); // aberto, em_andamento, concluido

        table.foreign('responsavel_admin_id').references('profiles.id');
    });
};

exports.down = function (knex) {
    return knex.schema.table('filiacoes', function (table) {
        table.dropColumn('protocolo');
        table.dropColumn('responsavel_admin_id');
        table.dropColumn('status_atendimento');
    });
};
