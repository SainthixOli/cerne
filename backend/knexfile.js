const path = require('path');

const migrations = {
    directory: path.resolve(__dirname, 'db/migrations'),
    tableName: 'knex_migrations'
};

const seeds = {
    directory: path.resolve(__dirname, 'db/seeds')
};

function integerFromEnvironment(name, fallback) {
    const value = Number(process.env[name] || fallback);
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${name} deve ser um inteiro não negativo`);
    }
    return value;
}

function connectionFor(environment) {
    const suffix = environment === 'test' ? '_TEST' : '';
    const url = process.env[`DATABASE_URL${suffix}`] || process.env.DATABASE_URL;
    if (url) return url;

    return {
        host: process.env[`DB_HOST${suffix}`] || process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env[`DB_PORT${suffix}`] || process.env.DB_PORT || 5432),
        database: process.env[`DB_NAME${suffix}`] ||
            (environment === 'test' ? 'cerne_test' : process.env.DB_NAME),
        user: process.env[`DB_USER${suffix}`] || process.env.DB_USER,
        password: process.env[`DB_PASSWORD${suffix}`] || process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
    };
}

function configFor(environment) {
    return {
        client: 'pg',
        connection: connectionFor(environment),
        pool: {
            min: integerFromEnvironment('DB_POOL_MIN', environment === 'test' ? 0 : 2),
            max: integerFromEnvironment('DB_POOL_MAX', environment === 'test' ? 4 : 10)
        },
        migrations,
        seeds
    };
}

module.exports = {
    development: configFor('development'),
    test: configFor('test'),
    production: configFor('production')
};
