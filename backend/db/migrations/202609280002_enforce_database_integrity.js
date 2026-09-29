const TENANT_SCOPED = [
    'profiles', 'filiacoes', 'documentos', 'conversations', 'messages',
    'filiation_chat', 'notifications', 'admin_evaluations', 'system_settings',
    'audit_logs', 'security_alerts', 'affiliation_upload_tokens'
];

async function foreignKeys(knex, table) {
    const result = await knex.raw(`
        SELECT tc.constraint_name,
               array_agg(kcu.column_name::text ORDER BY kcu.ordinal_position)::text[] AS columns
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = current_schema() AND tc.table_name = ?
        GROUP BY tc.constraint_name
    `, [table]);
    return result.rows;
}

async function dropForeignForColumns(knex, table, columns) {
    const keys = await foreignKeys(knex, table);
    const expected = [...columns].sort().join(',');
    const match = keys.find((key) => [...key.columns].sort().join(',') === expected);
    if (match) {
        await knex.raw('ALTER TABLE ?? DROP CONSTRAINT ??', [table, match.constraint_name]);
    }
}

async function replaceForeign(knex, table, columns, targetTable, targetColumns, options = {}) {
    await dropForeignForColumns(knex, table, columns);
    await knex.schema.alterTable(table, (builder) => {
        let foreign = builder.foreign(columns, options.name).references(targetColumns).inTable(targetTable);
        if (options.onDelete) foreign = foreign.onDelete(options.onDelete);
        if (options.onUpdate) foreign.onUpdate(options.onUpdate);
    });
}

async function dropUnique(knex, table, name) {
    await knex.raw(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}"`);
}

async function dropIndex(knex, name) {
    await knex.raw(`DROP INDEX IF EXISTS "${name}"`);
}

async function setTenantNotNull(knex, table) {
    await knex.schema.alterTable(table, (builder) => {
        builder.integer('tenant_id').notNullable().alter();
    });
}

async function addPostgresChecks(knex) {
    await knex.raw(`ALTER TABLE profiles ADD CONSTRAINT phase2_profiles_role_check CHECK (role IN ('professor','admin','super_admin','system_manager'))`);
    await knex.raw(`ALTER TABLE profiles ADD CONSTRAINT phase2_profiles_status_check CHECK (status_conta IN ('pendente_docs','em_analise','ativo','inativo'))`);
    await knex.raw(`ALTER TABLE filiacoes ADD CONSTRAINT phase2_affiliations_status_check CHECK (status IN ('em_processamento','concluido','rejeitado','solicitando_desfiliacao','desfiliado','solicitando_reativacao'))`);
    await knex.raw(`ALTER TABLE filiacoes ADD CONSTRAINT phase2_service_status_check CHECK (status_atendimento IN ('aberto','em_andamento','concluido'))`);
    await knex.raw(`ALTER TABLE filiacoes ADD CONSTRAINT phase2_transfer_status_check CHECK (transfer_status IS NULL OR transfer_status = 'pending')`);
    await knex.raw(`ALTER TABLE admin_evaluations ADD CONSTRAINT phase2_evaluation_score_check CHECK (score IS NULL OR score BETWEEN 1 AND 5)`);
    await knex.raw(`ALTER TABLE admin_evaluations ADD CONSTRAINT phase2_evaluation_criteria_check CHECK (criteria_productivity BETWEEN 0 AND 5 AND criteria_quality BETWEEN 0 AND 5 AND criteria_proactivity BETWEEN 0 AND 5 AND criteria_punctuality BETWEEN 0 AND 5)`);
    await knex.raw(`ALTER TABLE admin_evaluations ADD CONSTRAINT phase2_evaluation_month_check CHECK (month_ref ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')`);
    await knex.raw(`
        CREATE FUNCTION phase2_validate_technical_admin() RETURNS trigger AS $$
        BEGIN
            IF NEW.technical_admin_id IS NOT NULL AND NOT EXISTS (
                SELECT 1 FROM profiles p WHERE p.id=NEW.technical_admin_id AND p.tenant_id=NEW.id AND p.role='system_manager'
            ) THEN RAISE EXCEPTION 'invalid technical admin'; END IF;
            RETURN NEW;
        END; $$ LANGUAGE plpgsql;
        CREATE TRIGGER phase2_tenants_validate_technical BEFORE INSERT OR UPDATE OF technical_admin_id,id ON tenants
        FOR EACH ROW EXECUTE FUNCTION phase2_validate_technical_admin();
    `);
}

exports.up = async function up(knex) {
    for (const column of ['criteria_productivity', 'criteria_quality', 'criteria_proactivity', 'criteria_punctuality']) {
        if (!await knex.schema.hasColumn('admin_evaluations', column)) {
            await knex.schema.alterTable('admin_evaluations', (builder) => builder.integer(column).notNullable().defaultTo(0));
        }
    }
    if (!await knex.schema.hasColumn('admin_evaluations', 'visible_to_collaborator')) {
        await knex.schema.alterTable('admin_evaluations', (builder) => builder.boolean('visible_to_collaborator').notNullable().defaultTo(false));
    }

    for (const table of TENANT_SCOPED) await setTenantNotNull(knex, table);

    await knex.schema.alterTable('filiacoes', (builder) => {
        builder.string('user_id').notNullable().alter();
    });
    await knex.schema.alterTable('documentos', (builder) => {
        builder.string('user_id').notNullable().alter();
    });

    await knex.schema.alterTable('profiles', (builder) => builder.unique(['tenant_id', 'id'], 'profiles_tenant_id_id_unique'));
    await knex.schema.alterTable('filiacoes', (builder) => builder.unique(['tenant_id', 'id'], 'filiacoes_tenant_id_id_unique'));
    await knex.schema.alterTable('conversations', (builder) => builder.unique(['tenant_id', 'id'], 'conversations_tenant_id_id_unique'));

    for (const table of TENANT_SCOPED) {
        await replaceForeign(knex, table, ['tenant_id'], 'tenants', ['id'], {
            name: `${table}_tenant_id_foreign`, onDelete: 'RESTRICT', onUpdate: 'CASCADE'
        });
    }
    await knex.raw(`ALTER TABLE tenants ADD CONSTRAINT tenants_technical_admin_tenant_foreign
        FOREIGN KEY (id, technical_admin_id) REFERENCES profiles(tenant_id, id)`);

    await replaceForeign(knex, 'filiacoes', ['user_id'], 'profiles', ['id']);
    await replaceForeign(knex, 'filiacoes', ['responsavel_admin_id'], 'profiles', ['id']);
    await replaceForeign(knex, 'filiacoes', ['aprovado_por_admin_id'], 'profiles', ['id']);
    await replaceForeign(knex, 'filiacoes', ['tenant_id', 'user_id'], 'profiles', ['tenant_id', 'id'], { name: 'filiacoes_tenant_user_foreign', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    await replaceForeign(knex, 'filiacoes', ['tenant_id', 'responsavel_admin_id'], 'profiles', ['tenant_id', 'id'], { name: 'filiacoes_tenant_responsavel_foreign', onUpdate: 'CASCADE' });
    await replaceForeign(knex, 'filiacoes', ['tenant_id', 'aprovado_por_admin_id'], 'profiles', ['tenant_id', 'id'], { name: 'filiacoes_tenant_aprovador_foreign', onUpdate: 'CASCADE' });

    await replaceForeign(knex, 'documentos', ['user_id'], 'profiles', ['id']);
    await replaceForeign(knex, 'documentos', ['filiacao_id'], 'filiacoes', ['id']);
    await replaceForeign(knex, 'documentos', ['tenant_id', 'user_id'], 'profiles', ['tenant_id', 'id'], { name: 'documentos_tenant_user_foreign', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    await replaceForeign(knex, 'documentos', ['tenant_id', 'filiacao_id'], 'filiacoes', ['tenant_id', 'id'], { name: 'documentos_tenant_filiacao_foreign', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    await replaceForeign(knex, 'conversations', ['admin_id'], 'profiles', ['id']);
    await replaceForeign(knex, 'conversations', ['user_id'], 'profiles', ['id']);
    await replaceForeign(knex, 'conversations', ['tenant_id', 'admin_id'], 'profiles', ['tenant_id', 'id'], { name: 'conversations_tenant_admin_foreign', onUpdate: 'CASCADE' });
    await replaceForeign(knex, 'conversations', ['tenant_id', 'user_id'], 'profiles', ['tenant_id', 'id'], { name: 'conversations_tenant_user_foreign', onUpdate: 'CASCADE' });

    await replaceForeign(knex, 'messages', ['conversation_id'], 'conversations', ['id']);
    await replaceForeign(knex, 'messages', ['sender_id'], 'profiles', ['id']);
    await replaceForeign(knex, 'messages', ['tenant_id', 'conversation_id'], 'conversations', ['tenant_id', 'id'], { name: 'messages_tenant_conversation_foreign', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    await replaceForeign(knex, 'messages', ['tenant_id', 'sender_id'], 'profiles', ['tenant_id', 'id'], { name: 'messages_tenant_sender_foreign', onUpdate: 'CASCADE' });

    await replaceForeign(knex, 'filiation_chat', ['filiacao_id'], 'filiacoes', ['id']);
    await replaceForeign(knex, 'filiation_chat', ['sender_id'], 'profiles', ['id']);
    await replaceForeign(knex, 'filiation_chat', ['tenant_id', 'filiacao_id'], 'filiacoes', ['tenant_id', 'id'], { name: 'filiation_chat_tenant_filiacao_foreign', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    await replaceForeign(knex, 'filiation_chat', ['tenant_id', 'sender_id'], 'profiles', ['tenant_id', 'id'], { name: 'filiation_chat_tenant_sender_foreign', onUpdate: 'CASCADE' });

    await replaceForeign(knex, 'notifications', ['created_by'], 'profiles', ['id']);
    await replaceForeign(knex, 'notifications', ['approved_by'], 'profiles', ['id']);
    await replaceForeign(knex, 'notifications', ['tenant_id', 'created_by'], 'profiles', ['tenant_id', 'id'], { name: 'notifications_tenant_creator_foreign', onUpdate: 'CASCADE' });
    await replaceForeign(knex, 'notifications', ['tenant_id', 'approved_by'], 'profiles', ['tenant_id', 'id'], { name: 'notifications_tenant_approver_foreign', onUpdate: 'CASCADE' });

    await replaceForeign(knex, 'admin_evaluations', ['admin_id'], 'profiles', ['id']);
    await replaceForeign(knex, 'admin_evaluations', ['evaluator_id'], 'profiles', ['id']);
    await replaceForeign(knex, 'admin_evaluations', ['tenant_id', 'admin_id'], 'profiles', ['tenant_id', 'id'], { name: 'admin_evaluations_tenant_admin_foreign', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    await replaceForeign(knex, 'admin_evaluations', ['tenant_id', 'evaluator_id'], 'profiles', ['tenant_id', 'id'], { name: 'admin_evaluations_tenant_evaluator_foreign', onUpdate: 'CASCADE' });

    await replaceForeign(knex, 'audit_logs', ['admin_id'], 'profiles', ['id']);
    await replaceForeign(knex, 'audit_logs', ['tenant_id', 'admin_id'], 'profiles', ['tenant_id', 'id'], { name: 'audit_logs_tenant_admin_foreign', onUpdate: 'CASCADE' });
    await replaceForeign(knex, 'security_alerts', ['affected_user_id'], 'profiles', ['id']);
    await replaceForeign(knex, 'security_alerts', ['tenant_id', 'affected_user_id'], 'profiles', ['tenant_id', 'id'], { name: 'security_alerts_tenant_affected_foreign', onUpdate: 'CASCADE' });
    await replaceForeign(knex, 'security_alerts', ['acknowledged_by'], 'profiles', ['id']);
    await replaceForeign(knex, 'security_alerts', ['tenant_id', 'acknowledged_by'], 'profiles', ['tenant_id', 'id'], { name: 'security_alerts_tenant_acknowledger_foreign', onUpdate: 'CASCADE' });
    await replaceForeign(knex, 'affiliation_upload_tokens', ['filiacao_id'], 'filiacoes', ['id']);
    await replaceForeign(knex, 'affiliation_upload_tokens', ['tenant_id', 'filiacao_id'], 'filiacoes', ['tenant_id', 'id'], { name: 'upload_tokens_tenant_filiacao_foreign', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    await dropUnique(knex, 'filiacoes', 'filiacoes_protocolo_unique');
    await dropUnique(knex, 'admin_evaluations', 'admin_evaluations_admin_id_month_ref_unique');
    await dropUnique(knex, 'conversations', 'conversations_admin_id_user_id_unique');
    await knex.schema.alterTable('filiacoes', (builder) => builder.unique(['tenant_id', 'protocolo'], 'filiacoes_tenant_id_protocolo_unique'));
    await knex.schema.alterTable('admin_evaluations', (builder) => builder.unique(['tenant_id', 'admin_id', 'month_ref'], 'admin_evaluations_tenant_admin_month_unique'));
    await knex.schema.alterTable('conversations', (builder) => builder.unique(['tenant_id', 'admin_id', 'user_id'], 'conversations_tenant_admin_user_unique'));

    for (const name of [
        'security_alerts_tenant_id_index',
        'security_alerts_tenant_id_severity_index',
        'security_alerts_tenant_id_acknowledged_index'
    ]) await dropIndex(knex, name);
    await knex.schema.alterTable('security_alerts', (builder) => {
        builder.index(['tenant_id'], 'security_alerts_tenant_id_index');
        builder.index(['tenant_id', 'severity'], 'security_alerts_tenant_id_severity_index');
        builder.index(['tenant_id', 'acknowledged'], 'security_alerts_tenant_id_acknowledged_index');
    });

    await knex.schema.alterTable('system_settings', (builder) => {
        builder.dropPrimary();
        builder.primary(['tenant_id', 'key'], 'system_settings_pkey');
    });

    await addPostgresChecks(knex);
};

exports.down = async function down(knex) {
    await knex.raw('ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_technical_admin_tenant_foreign');
    for (const [table, constraint] of [
        ['profiles', 'phase2_profiles_role_check'], ['profiles', 'phase2_profiles_status_check'],
        ['filiacoes', 'phase2_affiliations_status_check'], ['filiacoes', 'phase2_service_status_check'],
        ['filiacoes', 'phase2_transfer_status_check'], ['admin_evaluations', 'phase2_evaluation_score_check'],
        ['admin_evaluations', 'phase2_evaluation_criteria_check'], ['admin_evaluations', 'phase2_evaluation_month_check']
    ]) await knex.raw(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint}"`);
    await knex.raw('DROP TRIGGER IF EXISTS phase2_tenants_validate_technical ON tenants');
    await knex.raw('DROP FUNCTION IF EXISTS phase2_validate_technical_admin()');

    await knex.schema.alterTable('system_settings', (builder) => {
        builder.dropPrimary();
        builder.primary(['key']);
    });

    const compositeKeys = [
        ['filiacoes', ['tenant_id', 'user_id']], ['filiacoes', ['tenant_id', 'responsavel_admin_id']], ['filiacoes', ['tenant_id', 'aprovado_por_admin_id']],
        ['documentos', ['tenant_id', 'user_id']], ['documentos', ['tenant_id', 'filiacao_id']],
        ['conversations', ['tenant_id', 'admin_id']], ['conversations', ['tenant_id', 'user_id']],
        ['messages', ['tenant_id', 'conversation_id']], ['messages', ['tenant_id', 'sender_id']],
        ['filiation_chat', ['tenant_id', 'filiacao_id']], ['filiation_chat', ['tenant_id', 'sender_id']],
        ['notifications', ['tenant_id', 'created_by']], ['notifications', ['tenant_id', 'approved_by']],
        ['admin_evaluations', ['tenant_id', 'admin_id']], ['admin_evaluations', ['tenant_id', 'evaluator_id']],
        ['audit_logs', ['tenant_id', 'admin_id']], ['security_alerts', ['tenant_id', 'affected_user_id']],
        ['security_alerts', ['tenant_id', 'acknowledged_by']],
        ['affiliation_upload_tokens', ['tenant_id', 'filiacao_id']]
    ];
    for (const [table, columns] of compositeKeys) await dropForeignForColumns(knex, table, columns);
    for (const table of TENANT_SCOPED) await dropForeignForColumns(knex, table, ['tenant_id']);

    await dropUnique(knex, 'filiacoes', 'filiacoes_tenant_id_protocolo_unique');
    await dropUnique(knex, 'admin_evaluations', 'admin_evaluations_tenant_admin_month_unique');
    await dropUnique(knex, 'conversations', 'conversations_tenant_admin_user_unique');
    await dropUnique(knex, 'profiles', 'profiles_tenant_id_id_unique');
    await dropUnique(knex, 'filiacoes', 'filiacoes_tenant_id_id_unique');
    await dropUnique(knex, 'conversations', 'conversations_tenant_id_id_unique');

    // Older down migrations drop parent tables before every legacy child relation is gone.
    // Remove the remaining legacy FKs here so a complete rollback stays deterministic.
    for (const table of [...TENANT_SCOPED, 'tenant_super_admins']) {
        let remaining = await foreignKeys(knex, table);
        while (remaining.length > 0) {
            await dropForeignForColumns(knex, table, remaining[0].columns);
            remaining = await foreignKeys(knex, table);
        }
    }

    for (const table of TENANT_SCOPED) {
        await knex.schema.alterTable(table, (builder) => builder.integer('tenant_id').nullable().alter());
    }
    await knex.schema.alterTable('filiacoes', (builder) => {
        builder.string('user_id').nullable().alter();
    });
    await knex.schema.alterTable('documentos', (builder) => {
        builder.string('user_id').nullable().alter();
    });
};
