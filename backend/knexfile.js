// Update with your config settings.
const path = require('path');

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

    development: {
        client: 'sqlite3',
        connection: {
            filename: path.resolve(__dirname, 'db/database.sqlite')
        },
        useNullAsDefault: true,
        migrations: {
            directory: path.resolve(__dirname, 'db/migrations'),
            tableName: 'knex_migrations'
        },
        seeds: {
            directory: path.resolve(__dirname, 'db/seeds')
        }
    },

    test: {
        client: 'sqlite3',
        connection: {
            filename: path.resolve(__dirname, 'db/test_database.sqlite')
        },
        useNullAsDefault: true,
        migrations: {
            directory: path.resolve(__dirname, 'db/migrations'),
            tableName: 'knex_migrations'
        },
        seeds: {
            directory: path.resolve(__dirname, 'db/seeds')
        }
    },

    production: {
        client: 'postgresql',
        connection: {
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            directory: path.resolve(__dirname, 'db/migrations'),
            tableName: 'knex_migrations'
        }
    }

};
