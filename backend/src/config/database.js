const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

let dbInstance = null;

async function getDb() {
    if (dbInstance) return dbInstance;

    const dbPath = path.resolve(__dirname, '../../db/database.sqlite');

    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Initialize schema if needed
    const schemaPath = path.resolve(__dirname, '../../db/local_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await dbInstance.exec(schema);

    return dbInstance;
}

module.exports = { getDb };
