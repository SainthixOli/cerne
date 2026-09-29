const knex = require('../src/config/connection');
const { requireScriptEnv } = require('./scriptEnv');
const { tenantFromEnvironment } = require('./userProvisioning');

async function main() {
    try {
        const tenantId = await tenantFromEnvironment();
        const userId = requireScriptEnv('CERNE_DEBUG_USER_ID');
        const user = await knex('profiles').select('id', 'status_conta')
            .where({ id: userId, tenant_id: tenantId }).first();
        if (!user) return console.log('User not found.');
        const [{ count }] = await knex('filiacoes').where({ user_id: user.id, tenant_id: tenantId })
            .count('* as count');
        console.log('User found; account status:', user.status_conta);
        console.log('Affiliation request count:', Number(count));
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await knex.destroy();
    }
}

main();
