const { getDb } = require('../config/database');

async function migrate() {
    console.log('Starting schema migration...');
    const db = await getDb();

    const columnsToAdd = [
        { name: 'rg', type: 'TEXT' },
        { name: 'orgao_emissor', type: 'TEXT' },
        { name: 'nacionalidade', type: 'TEXT' },
        { name: 'estado_civil', type: 'TEXT' },
        { name: 'cep', type: 'TEXT' },
        { name: 'endereco', type: 'TEXT' },
        { name: 'numero', type: 'TEXT' },
        { name: 'complemento', type: 'TEXT' },
        { name: 'bairro', type: 'TEXT' },
        { name: 'cidade', type: 'TEXT' },
        { name: 'uf', type: 'TEXT' }
    ];

    for (const col of columnsToAdd) {
        try {
            await db.run(`ALTER TABLE profiles ADD COLUMN ${col.name} ${col.type}`);
            console.log(`Added column: ${col.name}`);
        } catch (error) {
            if (error.message.includes('duplicate column name')) {
                console.log(`Column ${col.name} already exists. Skipping.`);
            } else {
                console.error(`Error adding column ${col.name}:`, error.message);
            }
        }
    }

    console.log('Migration complete.');
}

migrate();
