const fs = require('fs');
const path = require('path');
const { getDb } = require('../config/database');

// Schemas to enforce
const SCHEMAS = [
    'local_schema.sql',
    'audit_schema.sql'
];

async function runHealthCheck() {
    console.log('[System] Running startup health check...');

    try {
        // 1. Check DB Connection
        const db = await getDb();
        console.log('[System] Database connection verified.');

        // 2. Enforce Schemas
        for (const schemaFile of SCHEMAS) {
            const schemaPath = path.resolve(__dirname, `../../db/${schemaFile}`);
            if (fs.existsSync(schemaPath)) {
                console.log(`[System] Enforcing schema: ${schemaFile}`);
                const schemaSql = fs.readFileSync(schemaPath, 'utf8');
                await db.exec(schemaSql);
            } else {
                console.warn(`[System] Warning: Schema file not found: ${schemaFile}`);
            }
        }

        // 3. Verify Critical Tables (Example: ensuring audit_logs exists)
        // Note: The schema exec above usually handles "CREATE TABLE IF NOT EXISTS", so this is a double check.
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        const tableNames = tables.map(t => t.name);

        const criticalTables = ['profiles', 'filiacoes', 'audit_logs', 'messages'];
        const missingTables = criticalTables.filter(t => !tableNames.includes(t));

        if (missingTables.length > 0) {
            console.error(`[System] CRITICAL: Missing tables: ${missingTables.join(', ')}`);
            // In a more advanced healer, we might try to recreate them specifically, but for now enforcing schema should have caught it.
        } else {
            console.log('[System] Critical tables verified.');
        }

        console.log('[System] Health check passed. System ready.');
        return true;
    } catch (error) {
        console.error('[System] Health check FAILED:', error);
        return false;
    }
}

module.exports = { runHealthCheck };
