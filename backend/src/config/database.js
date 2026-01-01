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

    // Inicializa o schema principal se necessário
    const schemaPath = path.resolve(__dirname, '../../db/local_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await dbInstance.exec(schema);

    // Inicializa o schema de auditoria e logs
    const auditSchemaPath = path.resolve(__dirname, '../../db/audit_schema.sql');
    if (fs.existsSync(auditSchemaPath)) {
        const auditSchema = fs.readFileSync(auditSchemaPath, 'utf8');
        await dbInstance.exec(auditSchema);
    }

    return dbInstance;
}

module.exports = { getDb };
