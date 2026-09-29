const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const knex = require('../src/config/connection');
const { assertScriptSecret, requireScriptEnv } = require('./scriptEnv');
const { tenantFromEnvironment } = require('./userProvisioning');

async function main() {
    try {
        const tenantId = await tenantFromEnvironment();
        const users = JSON.parse(requireScriptEnv('CERNE_SEED_USERS_JSON'));
        if (!Array.isArray(users) || users.length === 0) throw new Error('CERNE_SEED_USERS_JSON deve ser um array não vazio');
        await knex.transaction(async (trx) => {
            for (const user of users) {
                for (const field of ['name', 'cpf', 'email', 'role', 'password']) {
                    if (!user[field]) throw new Error(`Usuário sem campo obrigatório: ${field}`);
                }
                assertScriptSecret(user.password, 'seed user password');
                const record = {
                    id: uuidv4(), tenant_id: tenantId, nome_completo: user.name, cpf: user.cpf,
                    email: user.email, role: user.role, status_conta: 'ativo',
                    password_hash: await bcrypt.hash(user.password, 10)
                };
                await trx('profiles').insert(record).onConflict(['tenant_id', 'cpf']).merge({
                    nome_completo: record.nome_completo,
                    email: record.email,
                    role: record.role,
                    password_hash: record.password_hash,
                    status_conta: record.status_conta
                });
            }
        });
        console.log('Seed concluído.');
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await knex.destroy();
    }
}

main();
