const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { assertScriptSecret, requireScriptEnv } = require('./scriptEnv');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

function loadUsers() {
    const serializedUsers = requireScriptEnv('CERNE_SEED_USERS_JSON');
    let users;

    try {
        users = JSON.parse(serializedUsers);
    } catch {
        throw new Error('CERNE_SEED_USERS_JSON must contain a valid JSON array');
    }

    if (!Array.isArray(users) || users.length === 0) {
        throw new Error('CERNE_SEED_USERS_JSON must contain at least one user');
    }

    for (const user of users) {
        const requiredFields = ['name', 'cpf', 'email', 'role', 'password'];
        if (requiredFields.some((field) => !user[field])) {
            throw new Error('Each seed user must define name, cpf, email, role and password');
        }
        assertScriptSecret(user.password, 'seed user password');
    }

    return users;
}

const seed = async () => {
    const users = loadUsers();
    console.log('Seeding users...');

    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const id = uuidv4();

        db.run(
            `INSERT OR REPLACE INTO profiles (id, nome_completo, cpf, email, role, password_hash, status_conta)
             VALUES (?, ?, ?, ?, ?, ?, 'ativo')`,
            [id, user.name, user.cpf, user.email, user.role, hashedPassword],
            (error) => {
                if (error) {
                    console.error('Error inserting seed user:', error.message);
                } else {
                    console.log('Seed user inserted or updated successfully.');
                }
            }
        );
    }
};

db.serialize(() => {
    seed().then(() => {
        setTimeout(() => {
            console.log('Seeding complete.');
            db.close();
        }, 1000);
    }).catch((error) => {
        console.error(error.message);
        db.close();
        process.exitCode = 1;
    });
});
