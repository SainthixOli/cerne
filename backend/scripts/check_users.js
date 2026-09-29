const knex = require('../src/config/connection');
const { tenantFromEnvironment } = require('./userProvisioning');

async function main() {
    try {
        const tenantId = await tenantFromEnvironment();
        const users = await knex('profiles').select('id', 'role', 'status_conta')
            .where({ tenant_id: tenantId }).orderBy('id');
        console.table(users);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await knex.destroy();
    }
}

main();
