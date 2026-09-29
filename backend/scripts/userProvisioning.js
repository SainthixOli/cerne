const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const knex = require('../src/config/connection');
const { requireScriptEnv } = require('./scriptEnv');

async function tenantFromEnvironment() {
    const slug = requireScriptEnv('CERNE_TENANT_SLUG');
    const tenant = await knex('tenants').where({ slug, status: 'ATIVO' }).first('id');
    if (!tenant) throw new Error('CERNE_TENANT_SLUG não identifica um tenant ativo');
    return tenant.id;
}

async function provision({ prefix, role, name, updateOnly = false }) {
    const tenantId = await tenantFromEnvironment();
    const cpf = requireScriptEnv(`${prefix}_CPF`);
    const email = requireScriptEnv(`${prefix}_EMAIL`);
    const password = requireScriptEnv(`${prefix}_PASSWORD`, { minLength: 12, secret: true });
    const passwordHash = await bcrypt.hash(password, 10);

    return knex.transaction(async (trx) => {
        const existing = await trx('profiles').where({ cpf, tenant_id: tenantId }).first('id');
        if (existing) {
            await trx('profiles').where({ id: existing.id, tenant_id: tenantId }).update({
                email,
                password_hash: passwordHash,
                role,
                status_conta: 'ativo',
                change_password_required: false
            });
            return 'updated';
        }
        if (updateOnly) return 'not-found';
        await trx('profiles').insert({
            id: uuidv4(),
            tenant_id: tenantId,
            nome_completo: name,
            cpf,
            email,
            password_hash: passwordHash,
            role,
            status_conta: 'ativo',
            change_password_required: false
        });
        return 'created';
    });
}

async function runProvision(options) {
    try {
        const result = await provision(options);
        console.log(`Operação concluída: ${result}.`);
    } catch (error) {
        console.error('Falha na operação:', error.message);
        process.exitCode = 1;
    } finally {
        await knex.destroy();
    }
}

module.exports = { tenantFromEnvironment, provision, runProvision };
