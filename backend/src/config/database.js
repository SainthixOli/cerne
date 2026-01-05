const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

let dbInstance = null;

async function getDb() {
    if (dbInstance) return dbInstance;

    const dbFilename = process.env.NODE_ENV === 'test' ? 'test_database.sqlite' : 'database.sqlite';
    const dbPath = path.resolve(__dirname, `../../db/${dbFilename}`);

    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Schema initialization is now handled by Knex migrations.
    // Run 'npm run db:migrate' to initialize the database.

    return dbInstance;
}

module.exports = { getDb };
