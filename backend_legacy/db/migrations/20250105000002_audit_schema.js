/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTableIfNotExists('audit_logs', function (table) {
        table.increments('id');
        table.string('admin_id').references('profiles.id');
        table.string('action_type'); // 'APPROVE', 'REJECT', 'UPDATE_PROFILE'
        table.string('target_id');
        table.text('details');
        table.datetime('created_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('audit_logs');
};
