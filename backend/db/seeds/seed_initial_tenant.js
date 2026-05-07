/**
 * Seed: Criar tenant inicial e atualizar dados legado
 * Versão: 1.0
 * Data: 7 de Maio de 2026
 */

exports.seed = async (knex) => {
    console.log('\n🌱 Iniciando seed de tenant...\n');

    try {
        // 1. Verificar se tenant já existe
        const existingTenant = await knex('tenants')
            .where('slug', 'sindicato-principal')
            .first();

        if (existingTenant) {
            console.log(`✅ Tenant "sindicato-principal" já existe (ID: ${existingTenant.id}), pulando seed\n`);
            return;
        }

        // 2. Criar tenant principal
        const [tenantId] = await knex('tenants').insert({
            name: 'Sindicato Principal',
            slug: 'sindicato-principal',
            status: 'ATIVO',
            plan: 'professional',
            database_url: null,  // Multi-tenant no mesmo banco
            storage_used_gb: 0,
            users_count: 0,
            technical_admin_id: null
        });

        console.log(`✅ Tenant criado com ID: ${tenantId}`);
        console.log(`   Nome: Sindicato Principal`);
        console.log(`   Slug: sindicato-principal`);
        console.log(`   Status: ATIVO\n`);

        // 3. Atualizar dados legado (sem tenant_id) com tenant_id = tenantId

        const profilesUpdated = await knex('profiles')
            .whereNull('tenant_id')
            .update({ tenant_id: tenantId });
        console.log(`✅ Profiles: ${profilesUpdated} registros atualizados`);

        const filiacoesUpdated = await knex('filiacoes')
            .whereNull('tenant_id')
            .update({ tenant_id: tenantId });
        console.log(`✅ Filiacoes: ${filiacoesUpdated} registros atualizados`);

        const documentosUpdated = await knex('documentos')
            .whereNull('tenant_id')
            .update({ tenant_id: tenantId });
        console.log(`✅ Documentos: ${documentosUpdated} registros atualizados`);

        const conversationsUpdated = await knex('conversations')
            .whereNull('tenant_id')
            .update({ tenant_id: tenantId });
        console.log(`✅ Conversations: ${conversationsUpdated} registros atualizados`);

        const messagesUpdated = await knex('messages')
            .whereNull('tenant_id')
            .update({ tenant_id: tenantId });
        console.log(`✅ Messages: ${messagesUpdated} registros atualizados`);

        const filiationChatUpdated = await knex('filiation_chat')
            .whereNull('tenant_id')
            .update({ tenant_id: tenantId });
        console.log(`✅ Filiation_chat: ${filiationChatUpdated} registros atualizados`);

        const notificationsUpdated = await knex('notifications')
            .whereNull('tenant_id')
            .update({ tenant_id: tenantId });
        console.log(`✅ Notifications: ${notificationsUpdated} registros atualizados`);

        const adminEvalUpdated = await knex('admin_evaluations')
            .whereNull('tenant_id')
            .update({ tenant_id: tenantId });
        console.log(`✅ Admin_evaluations: ${adminEvalUpdated} registros atualizados`);

        const systemSettingsUpdated = await knex('system_settings')
            .whereNull('tenant_id')
            .update({ tenant_id: tenantId });
        console.log(`✅ System_settings: ${systemSettingsUpdated} registros atualizados\n`);

        // 4. Associar super admin
        const superAdmin = await knex('profiles')
            .where('role', 'admin')
            .orWhere('role', 'system_admin')
            .first();

        if (superAdmin) {
            try {
                await knex('tenant_super_admins').insert({
                    tenant_id: tenantId,
                    user_id: superAdmin.id
                });
                console.log(`✅ Super admin associado: ${superAdmin.id}`);
                console.log(`   Name: ${superAdmin.name || 'N/A'}`);
                console.log(`   Email: ${superAdmin.email || 'N/A'}`);
            } catch (err) {
                if (err.code === 'SQLITE_CONSTRAINT' || err.message.includes('UNIQUE')) {
                    console.log(`⚠️  Super admin ${superAdmin.id} já associado`);
                } else {
                    throw err;
                }
            }
        } else {
            console.log(`⚠️  Nenhum admin encontrado para associar`);
        }

        console.log(`\n🎉 Seed concluído com sucesso!\n`);
        console.log(`📊 Resumo:`);
        console.log(`   - Tenant ID: ${tenantId}`);
        console.log(`   - Dados legado migrados para tenant ${tenantId}`);
        console.log(`   - Pronto para multi-tenant!\n`);

    } catch (error) {
        console.error(`\n❌ Erro no seed: ${error.message}\n`);
        throw error;
    }
};
