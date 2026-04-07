
exports.up = function (knex) {
    return knex.schema.table('filiacoes', function (table) {
        table.string('transfer_status').nullable(); // 'pending' or NULL
    });
};

exports.down = function (knex) {
    return knex.schema.table('filiacoes', function (table) {
        table.dropColumn('transfer_status');
    });
};
