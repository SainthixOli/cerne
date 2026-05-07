/**
 * Migration: Criar tabelas de multi-tenant (tenants e tenant_super_admins)
 * Versão: 1.0
 * Data: 7 de Maio de 2026
 * 
 * Mudanças:
 * 1. Criar tabela 'tenants' para armazenar informações de cada tenant
 * 2. Criar tabela 'tenant_super_admins' para relacionar super admins com tenants
 * 3. Adicionar índices para performance
 */

exports.up = async function(knex) {
    // 1. Criar tabela 'tenants'
    await knex.schema.createTable('tenants', (table) => {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.string('slug', 100).unique().notNullable();
        table.enum('status', ['ATIVO', 'SUSPENSO', 'INATIVO']).defaultTo('ATIVO');
        table.enum('plan', ['free', 'professional', 'enterprise']).defaultTo('professional');
        table.text('database_url').nullable();
        table.decimal('storage_used_gb', 10, 2).defaultTo(0);
        table.integer('users_count').defaultTo(0);
        table.string('technical_admin_id', 36).nullable();
        table.timestamps(true, true);
        
        // Índices para performance
        table.index('status');
        table.index('created_at');
        table.index('slug');
    });

    // 2. Criar tabela 'tenant_super_admins'
    await knex.schema.createTable('tenant_super_admins', (table) => {
        table.increments('id').primary();
        table.integer('tenant_id').notNullable().unsigned().references('id').inTable('tenants');
        table.string('user_id', 36).notNullable().references('id').inTable('profiles');
        table.string('email', 255).nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        
        // Índices
        table.index('tenant_id');
        table.index('user_id');
        table.unique(['tenant_id', 'user_id']);
    });

    console.log('✅ Tabelas de tenants criadas com sucesso');
};

exports.down = async function(knex) {
    // Reverter na ordem inversa
    await knex.schema.dropTableIfExists('tenant_super_admins');
    await knex.schema.dropTableIfExists('tenants');
    
    console.log('✅ Tabelas de tenants removidas');
};
