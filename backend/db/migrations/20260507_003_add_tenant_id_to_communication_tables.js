/**
 * Migration: Adicionar tenant_id às tabelas de comunicação (Parte 2)
 * Versão: 1.0
 * Data: 7 de Maio de 2026
 * 
 * Tabelas afetadas:
 * - conversations (conversas 1:1)
 * - messages (mensagens de chat)
 * - filiation_chat (chat de filiação)
 * - notifications (notificações broadcast)
 */

exports.up = async function(knex) {
    // 1. Adicionar tenant_id a 'conversations'
    const conversationsExists = await knex.schema.hasColumn('conversations', 'tenant_id');
    if (!conversationsExists) {
        await knex.schema.table('conversations', (table) => {
            table.integer('tenant_id').unsigned().nullable();
            table.index('tenant_id');
            table.index(['tenant_id', 'admin_id']);
            table.index(['tenant_id', 'user_id']);
        });
        console.log('✅ tenant_id adicionado a conversations');
    }

    // 2. Adicionar tenant_id a 'messages'
    const messagesExists = await knex.schema.hasColumn('messages', 'tenant_id');
    if (!messagesExists) {
        await knex.schema.table('messages', (table) => {
            table.integer('tenant_id').unsigned().nullable();
            table.index('tenant_id');
            table.index(['tenant_id', 'conversation_id']);
        });
        console.log('✅ tenant_id adicionado a messages');
    }

    // 3. Adicionar tenant_id a 'filiation_chat'
    const filiationChatExists = await knex.schema.hasColumn('filiation_chat', 'tenant_id');
    if (!filiationChatExists) {
        await knex.schema.table('filiation_chat', (table) => {
            table.integer('tenant_id').unsigned().nullable();
            table.index('tenant_id');
            table.index(['tenant_id', 'filiacao_id']);
        });
        console.log('✅ tenant_id adicionado a filiation_chat');
    }

    // 4. Adicionar tenant_id a 'notifications'
    const notificationsExists = await knex.schema.hasColumn('notifications', 'tenant_id');
    if (!notificationsExists) {
        await knex.schema.table('notifications', (table) => {
            table.integer('tenant_id').unsigned().nullable();
            table.index('tenant_id');
            table.index(['tenant_id', 'status']);
            table.index(['tenant_id', 'target_group']);
        });
        console.log('✅ tenant_id adicionado a notifications');
    }
};

exports.down = async function(knex) {
    // Reverter na ordem inversa
    const conversationsExists = await knex.schema.hasColumn('conversations', 'tenant_id');
    if (conversationsExists) {
        await knex.schema.table('conversations', (table) => {
            table.dropIndex(['tenant_id', 'user_id']);
            table.dropIndex(['tenant_id', 'admin_id']);
            table.dropIndex('tenant_id');
            table.dropColumn('tenant_id');
        });
    }

    const messagesExists = await knex.schema.hasColumn('messages', 'tenant_id');
    if (messagesExists) {
        await knex.schema.table('messages', (table) => {
            table.dropIndex(['tenant_id', 'conversation_id']);
            table.dropIndex('tenant_id');
            table.dropColumn('tenant_id');
        });
    }

    const filiationChatExists = await knex.schema.hasColumn('filiation_chat', 'tenant_id');
    if (filiationChatExists) {
        await knex.schema.table('filiation_chat', (table) => {
            table.dropIndex(['tenant_id', 'filiacao_id']);
            table.dropIndex('tenant_id');
            table.dropColumn('tenant_id');
        });
    }

    const notificationsExists = await knex.schema.hasColumn('notifications', 'tenant_id');
    if (notificationsExists) {
        await knex.schema.table('notifications', (table) => {
            table.dropIndex(['tenant_id', 'target_group']);
            table.dropIndex(['tenant_id', 'status']);
            table.dropIndex('tenant_id');
            table.dropColumn('tenant_id');
        });
    }
};
