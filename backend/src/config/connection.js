const { AsyncLocalStorage } = require('async_hooks');
const environment = process.env.NODE_ENV || 'development';
const config = require('../../knexfile')[environment];
const rootConnection = require('knex')(config);
const tenantStorage = new AsyncLocalStorage();

function activeConnection() {
    return tenantStorage.getStore()?.trx || rootConnection;
}

function connection(...args) {
    return activeConnection()(...args);
}

const knex = new Proxy(connection, {
    get(_target, property) {
        if (property === 'rootConnection') return rootConnection;
        if (property === 'activeConnection') return activeConnection;
        if (property === 'withTenantTransaction') return withTenantTransaction;
        const active = activeConnection();
        const value = active[property];
        return typeof value === 'function' ? value.bind(active) : value;
    }
});

async function withTenantTransaction(tenantId, callback) {
    if (!Number.isInteger(tenantId) || tenantId <= 0) {
        throw new TypeError('tenantId deve ser um inteiro positivo');
    }

    const current = tenantStorage.getStore();
    if (current) {
        if (current.tenantId !== tenantId) throw new Error('Tentativa de trocar tenant dentro da mesma transação');
        return callback(knex);
    }

    return rootConnection.transaction(async (trx) => {
        await trx.raw("SELECT set_config('app.tenant_id', ?, true)", [String(tenantId)]);
        return tenantStorage.run({ trx, tenantId }, () => callback(knex));
    });
}

module.exports = knex;
