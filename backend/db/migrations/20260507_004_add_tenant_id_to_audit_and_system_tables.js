/**
 * Migration: Adicionar tenant_id às tabelas de auditoria e sistema (Parte 3)
 * Versão: 1.0
 * Data: 7 de Maio de 2026
 * 
 * Tabelas afetadas:
 * - admin_evaluations (avaliações de admin)
 * - system_settings (configurações do sistema)
 * - audit_logs (histórico de ações)
 * - security_alerts (alertas de segurança)
 */

exports.up = async function(knex) {
    // 1. Adicionar tenant_id a 'admin_evaluations'
    const adminEvalExists = await knex.schema.hasColumn('admin_evaluations', 'tenant_id');
    if (!adminEvalExists) {
        await knex.schema.table('admin_evaluations', (table) => {
            table.integer('tenant_id').unsigned().nullable();
            table.index('tenant_id');
            table.index(['tenant_id', 'admin_id']);
        });
        console.log('✅ tenant_id adicionado a admin_evaluations');
    }

    // 2. Adicionar tenant_id a 'system_settings'
    const systemSettingsExists = await knex.schema.hasColumn('system_settings', 'tenant_id');
    if (!systemSettingsExists) {
        await knex.schema.table('system_settings', (table) => {
            table.integer('tenant_id').unsigned().nullable();
            table.index(['tenant_id', 'key']);
        });
        console.log('✅ tenant_id adicionado a system_settings');
    }

    // 3. Criar tabela 'audit_logs' se não existir
    const auditLogsExists = await knex.schema.hasTable('audit_logs');
    if (!auditLogsExists) {
        await knex.schema.createTable('audit_logs', (table) => {
            table.increments('id').primary();
            table.integer('tenant_id').unsigned().notNullable();
            table.string('admin_id', 36).notNullable().references('id').inTable('profiles');
            table.string('action_type', 100).notNullable();
            table.string('target_id', 100).nullable();
            table.text('details').nullable();
            table.string('ip_address', 45).nullable();
            table.string('user_agent', 255).nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            
            table.index('tenant_id');
            table.index(['tenant_id', 'admin_id']);
            table.index(['tenant_id', 'action_type']);
            table.index('created_at');
        });
        console.log('✅ Tabela audit_logs criada');
    } else {
        // Se a tabela existe, apenas adicionar tenant_id se não tiver
        const auditTenantExists = await knex.schema.hasColumn('audit_logs', 'tenant_id');
        if (!auditTenantExists) {
            await knex.schema.table('audit_logs', (table) => {
                table.integer('tenant_id').unsigned().nullable();
                table.index('tenant_id');
                table.index(['tenant_id', 'admin_id']);
                table.index(['tenant_id', 'action_type']);
            });
            console.log('✅ tenant_id adicionado a audit_logs');
        }
    }

    // 4. Criar tabela 'security_alerts' se não existir
    const securityAlertsExists = await knex.schema.hasTable('security_alerts');
    if (!securityAlertsExists) {
        await knex.schema.createTable('security_alerts', (table) => {
            table.increments('id').primary();
            table.integer('tenant_id').unsigned().notNullable();
            table.string('alert_type', 100).notNullable();
            table.string('severity', 50).notNullable();
            table.text('description').nullable();
            table.string('affected_user_id', 36).nullable().references('id').inTable('profiles');
            table.string('ip_address', 45).nullable();
            table.boolean('acknowledged').defaultTo(false);
            table.string('acknowledged_by', 36).nullable();
            table.timestamp('acknowledged_at').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            
            table.index('tenant_id');
            table.index(['tenant_id', 'severity']);
            table.index(['tenant_id', 'acknowledged']);
            table.index('created_at');
        });
        console.log('✅ Tabela security_alerts criada');
    } else {
        // Se a tabela existe, apenas adicionar tenant_id se não tiver
        const securityTenantExists = await knex.schema.hasColumn('security_alerts', 'tenant_id');
        if (!securityTenantExists) {
            await knex.schema.table('security_alerts', (table) => {
                table.integer('tenant_id').unsigned().nullable();
                table.index('tenant_id');
                table.index(['tenant_id', 'severity']);
            });
            console.log('✅ tenant_id adicionado a security_alerts');
        }
    }
};

exports.down = async function(knex) {
    // Reverter na ordem inversa
    const adminEvalExists = await knex.schema.hasColumn('admin_evaluations', 'tenant_id');
    if (adminEvalExists) {
        await knex.schema.table('admin_evaluations', (table) => {
            table.dropIndex(['tenant_id', 'admin_id']);
            table.dropIndex('tenant_id');
            table.dropColumn('tenant_id');
        });
    }

    const systemSettingsExists = await knex.schema.hasColumn('system_settings', 'tenant_id');
    if (systemSettingsExists) {
        await knex.schema.table('system_settings', (table) => {
            table.dropIndex(['tenant_id', 'key']);
            table.dropColumn('tenant_id');
        });
    }

    const auditLogsExists = await knex.schema.hasTable('audit_logs');
    if (auditLogsExists) {
        const auditTenantExists = await knex.schema.hasColumn('audit_logs', 'tenant_id');
        if (auditTenantExists) {
            await knex.schema.table('audit_logs', (table) => {
                table.dropIndex(['tenant_id', 'action_type']);
                table.dropIndex(['tenant_id', 'admin_id']);
                table.dropIndex('tenant_id');
                table.dropColumn('tenant_id');
            });
        }
    }

    const securityAlertsExists = await knex.schema.hasTable('security_alerts');
    if (securityAlertsExists) {
        const securityTenantExists = await knex.schema.hasColumn('security_alerts', 'tenant_id');
        if (securityTenantExists) {
            await knex.schema.table('security_alerts', (table) => {
                table.dropIndex(['tenant_id', 'severity']);
                table.dropIndex('tenant_id');
                table.dropColumn('tenant_id');
            });
        }
    }
};
