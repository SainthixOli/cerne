exports.up = async function (knex) {
    await knex.schema.createTable('delivery_outbox', (table) => {
        table.bigIncrements('id').primary();
        table.integer('tenant_id').notNullable()
            .references('id').inTable('tenants').onDelete('RESTRICT').onUpdate('CASCADE');
        table.string('event_type', 80).notNullable();
        table.text('encrypted_payload').notNullable();
        table.string('status', 20).notNullable().defaultTo('pending');
        table.integer('attempts').notNullable().defaultTo(0);
        table.timestamp('available_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('locked_at', { useTz: true });
        table.timestamp('processed_at', { useTz: true });
        table.string('last_error_code', 80);
        table.timestamps(true, true);
        table.check("status IN ('pending','processing','processed','failed')", [], 'delivery_outbox_status_check');
        table.index(['status', 'available_at'], 'delivery_outbox_pending_index');
        table.index(['tenant_id', 'id'], 'delivery_outbox_tenant_index');
    });

    await knex.raw('ALTER TABLE delivery_outbox ENABLE ROW LEVEL SECURITY');
    await knex.raw('ALTER TABLE delivery_outbox FORCE ROW LEVEL SECURITY');
    await knex.raw(`CREATE POLICY tenant_isolation ON delivery_outbox
        USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::integer)
        WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::integer)`);
    await knex.raw(`CREATE POLICY audited_global_access ON delivery_outbox
        USING (
            current_user = 'cerne_global'
            AND NULLIF(current_setting('app.global_actor_id', true), '') IS NOT NULL
            AND NULLIF(current_setting('app.global_reason', true), '') IS NOT NULL
        ) WITH CHECK (
            current_user = 'cerne_global'
            AND NULLIF(current_setting('app.global_actor_id', true), '') IS NOT NULL
            AND NULLIF(current_setting('app.global_reason', true), '') IS NOT NULL
        )`);
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('delivery_outbox');
};
