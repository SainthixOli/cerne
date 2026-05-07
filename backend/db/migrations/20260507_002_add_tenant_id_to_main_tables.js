/**
 * Migration: Adicionar tenant_id às tabelas existentes (Parte 1)
 * Versão: 1.0
 * Data: 7 de Maio de 2026
 * 
 * Tabelas afetadas:
 * - profiles (usuários)
 * - filiacoes (solicitações de filiação)
 * - documentos (arquivos de filiação)
 */

exports.up = async function(knex) {
    // 1. Adicionar tenant_id a 'profiles'
    const profilesExists = await knex.schema.hasColumn('profiles', 'tenant_id');
    if (!profilesExists) {
        await knex.schema.table('profiles', (table) => {
            table.integer('tenant_id').unsigned().nullable();
            table.index('tenant_id');
            table.unique(['tenant_id', 'email']);
        });
        console.log('✅ tenant_id adicionado a profiles');
    }

    // 2. Adicionar tenant_id a 'filiacoes'
    const filiacoesExists = await knex.schema.hasColumn('filiacoes', 'tenant_id');
    if (!filiacoesExists) {
        await knex.schema.table('filiacoes', (table) => {
            table.integer('tenant_id').unsigned().nullable();
            table.index('tenant_id');
            table.index(['tenant_id', 'user_id']);
        });
        console.log('✅ tenant_id adicionado a filiacoes');
    }

    // 3. Adicionar tenant_id a 'documentos'
    const documentosExists = await knex.schema.hasColumn('documentos', 'tenant_id');
    if (!documentosExists) {
        await knex.schema.table('documentos', (table) => {
            table.integer('tenant_id').unsigned().nullable();
            table.index('tenant_id');
            table.index(['tenant_id', 'filiacao_id']);
        });
        console.log('✅ tenant_id adicionado a documentos');
    }
};

exports.down = async function(knex) {
    // Reverter removendo colunas tenant_id
    const profilesExists = await knex.schema.hasColumn('profiles', 'tenant_id');
    if (profilesExists) {
        await knex.schema.table('profiles', (table) => {
            table.dropUnique(['tenant_id', 'email']);
            table.dropIndex('tenant_id');
            table.dropColumn('tenant_id');
        });
    }

    const filiacoesExists = await knex.schema.hasColumn('filiacoes', 'tenant_id');
    if (filiacoesExists) {
        await knex.schema.table('filiacoes', (table) => {
            table.dropIndex(['tenant_id', 'user_id']);
            table.dropIndex('tenant_id');
            table.dropColumn('tenant_id');
        });
    }

    const documentosExists = await knex.schema.hasColumn('documentos', 'tenant_id');
    if (documentosExists) {
        await knex.schema.table('documentos', (table) => {
            table.dropIndex(['tenant_id', 'filiacao_id']);
            table.dropIndex('tenant_id');
            table.dropColumn('tenant_id');
        });
    }
};
