const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

const users = [
    {
        name: 'Super Admin',
        cpf: '999.999.999-99',
        email: 'superadmin@empresax.com',
        role: 'super_admin',
        password: 'superadmin123'
    },
    {
        name: 'System Manager',
        cpf: '888.888.888-88',
        email: 'sysadmin@empresax.com',
        role: 'system_manager',
        password: 'sysadmin123'
    },
    {
        name: 'Admin Default',
        cpf: '000.000.000-00',
        email: 'admin@empresax.com',
        role: 'admin',
        password: 'admin123'
    }
];

const seed = async () => {
    console.log('Seeding users...');

    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const id = uuidv4();

        db.run(`INSERT OR REPLACE INTO profiles (id, nome_completo, cpf, email, role, password_hash, status_conta) VALUES (?, ?, ?, ?, ?, ?, 'ativo')`,
            [id, user.name, user.cpf, user.email, user.role, hashedPassword],
            (err) => {
                if (err) {
                    console.error(`Error inserting ${user.name}:`, err.message);
                } else {
                    console.log(`Inserted/Updated ${user.name} (CPF: ${user.cpf})`);
                }
            }
        );
    }
};

db.serialize(() => {
    seed().then(() => {
        // Wait a bit for async db operations to finish
        setTimeout(() => {
            console.log('Seeding complete.');
            db.close();
        }, 1000);
    });
});
