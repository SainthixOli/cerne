// A CPF/email identifies an account inside a tenant, not across the whole system.
exports.up = async (knex) => {
    await knex.schema.alterTable('profiles', (table) => {
        table.dropUnique('cpf');
        table.dropUnique('email');
        table.unique(['tenant_id', 'cpf']);
    });
};

exports.down = async (knex) => {
    const duplicateCpf = await knex('profiles').select('cpf').count('* as total')
        .groupBy('cpf').havingRaw('COUNT(*) > 1').first();
    const duplicateEmail = await knex('profiles').select('email').count('* as total')
        .whereNotNull('email').groupBy('email').havingRaw('COUNT(*) > 1').first();
    if (duplicateCpf || duplicateEmail) {
        throw new Error('Cannot restore global identity constraints while cross-tenant duplicates exist');
    }
    await knex.schema.alterTable('profiles', (table) => {
        table.dropUnique(['tenant_id', 'cpf']);
        table.unique('cpf');
        table.unique('email');
    });
};
