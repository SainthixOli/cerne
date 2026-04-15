/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTableIfNotExists('profiles', function (table) {
            table.string('id').primary(); // UUID
            table.string('nome_completo').notNullable();
            table.string('cpf').unique().notNullable();
            table.string('email').unique();
            table.string('password_hash');
            table.boolean('change_password_required').defaultTo(0);
            table.string('telefone');
            table.string('matricula_funcional');
            table.string('rg');
            table.string('orgao_emissor');
            table.string('nacionalidade');
            table.string('estado_civil');
            table.string('cep');
            table.string('endereco');
            table.string('numero');
            table.string('complemento');
            table.string('bairro');
            table.string('cidade');
            table.string('uf');
            // Role check handled by app logic or DB constraint if using raw SQL, knex syntax for check is complex across DBs
            table.string('role').notNullable().defaultTo('professor');
            table.string('status_conta').notNullable().defaultTo('pendente_docs');
            table.string('reset_token');
            table.datetime('reset_token_expires');
            table.string('photo_url');
        })
        .createTableIfNotExists('conversations', function (table) {
            table.string('id').primary();
            table.string('admin_id').notNullable().references('profiles.id');
            table.string('user_id').notNullable().references('profiles.id');
            table.datetime('last_updated').defaultTo(knex.fn.now());
            table.unique(['admin_id', 'user_id']);
        })
        .createTableIfNotExists('messages', function (table) {
            table.string('id').primary();
            table.string('conversation_id').notNullable().references('conversations.id').onDelete('CASCADE');
            table.string('sender_id').notNullable().references('profiles.id');
            table.text('content').notNullable();
            table.boolean('read').defaultTo(false);
            table.datetime('created_at').defaultTo(knex.fn.now());
        })
        .createTableIfNotExists('notifications', function (table) {
            table.string('id').primary();
            table.string('title').notNullable();
            table.text('message').notNullable();
            table.string('target_group').notNullable();
            table.string('status').defaultTo('pending');
            table.string('created_by').notNullable().references('profiles.id');
            table.string('approved_by').references('profiles.id');
            table.datetime('created_at').defaultTo(knex.fn.now());
        })
        .createTableIfNotExists('filiacoes', function (table) {
            table.increments('id');
            table.string('user_id').references('profiles.id').onDelete('CASCADE');
            table.datetime('data_solicitacao').defaultTo(knex.fn.now());
            table.datetime('data_aprovacao');
            table.string('status').notNullable().defaultTo('em_processamento');
            table.string('aprovado_por_admin_id').references('profiles.id').onDelete('SET NULL');
            table.text('observacoes_admin');
        })
        .createTableIfNotExists('documentos', function (table) {
            table.increments('id');
            table.string('user_id').references('profiles.id').onDelete('CASCADE');
            table.integer('filiacao_id').references('filiacoes.id').onDelete('CASCADE');
            table.string('url_arquivo').notNullable();
            table.string('tipo_documento').notNullable();
            table.datetime('data_upload').defaultTo(knex.fn.now());
        })
        .createTableIfNotExists('admin_evaluations', function (table) {
            table.increments('id');
            table.string('admin_id').notNullable().references('profiles.id').onDelete('CASCADE');
            table.string('evaluator_id').notNullable().references('profiles.id').onDelete('SET NULL');
            table.string('month_ref').notNullable();
            table.integer('score');
            table.text('feedback');
            table.datetime('created_at').defaultTo(knex.fn.now());
            table.unique(['admin_id', 'month_ref']);
        })
        .createTableIfNotExists('filiation_chat', function (table) {
            table.increments('id');
            table.integer('filiacao_id').notNullable().references('filiacoes.id').onDelete('CASCADE');
            table.string('sender_id').notNullable().references('profiles.id').onDelete('CASCADE');
            table.text('message').notNullable();
            table.datetime('created_at').defaultTo(knex.fn.now());
        })
        .createTableIfNotExists('system_settings', function (table) {
            table.string('key').primary();
            table.text('value').notNullable();
            table.datetime('updated_at').defaultTo(knex.fn.now());
        })
        .then(function () {
            // Seed initial data
            return knex('system_settings').insert({
                key: 'affiliation_terms',
                value: 'Eu, {{NOME}}, inscrito(a) no CPF sob o nº {{CPF}}, matrícula funcional nº {{MATRICULA}}, residente e domiciliado(a) nesta cidade, venho por meio deste requerer a minha admissão no quadro de associados desta entidade.\n\nDeclaro estar ciente e de pleno acordo com as normas estatutárias e regimentais que regem esta instituição, comprometendo-me a respeitá-las e cumpri-las.\n\nAutorizo, desde já, o envio de comunicações, boletos bancários e, quando aplicável, o desconto em folha de pagamento das contribuições associativas mensais, conforme estipulado em Assembleia Geral.'
            }).onConflict('key').ignore();
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('system_settings')
        .dropTableIfExists('filiation_chat')
        .dropTableIfExists('admin_evaluations')
        .dropTableIfExists('documentos')
        .dropTableIfExists('filiacoes')
        .dropTableIfExists('notifications')
        .dropTableIfExists('messages')
        .dropTableIfExists('conversations')
        .dropTableIfExists('profiles');
};
