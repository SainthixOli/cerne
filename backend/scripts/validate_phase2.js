const knex = require('../src/config/connection');

const TENANT_TABLES = [
    'profiles', 'filiacoes', 'documentos', 'conversations', 'messages',
    'filiation_chat', 'notifications', 'admin_evaluations', 'system_settings',
    'audit_logs', 'security_alerts', 'affiliation_upload_tokens'
];

async function main() {
    try {
        await knex.raw('SELECT 1');
        for (const table of TENANT_TABLES) {
            if (!await knex.schema.hasColumn(table, 'tenant_id')) throw new Error(`${table} sem tenant_id`);
            const [{ count }] = await knex(table).whereNull('tenant_id').count('* as count');
            if (Number(count) !== 0) throw new Error(`${table} contém tenant_id nulo`);
        }
        console.log('Schema PostgreSQL e isolamento estrutural validados.');
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await knex.destroy();
    }
}

main();
