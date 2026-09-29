exports.up = async function (knex) {
    await knex.schema.alterTable('security_alerts', (table) => {
        table.jsonb('details').notNullable().defaultTo('{}');
        table.text('admin_notes');
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable('security_alerts', (table) => {
        table.dropColumn('admin_notes');
        table.dropColumn('details');
    });
};
