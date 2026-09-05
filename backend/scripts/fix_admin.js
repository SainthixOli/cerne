const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { requireScriptEnv } = require('./scriptEnv');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

const fixAdmin = async () => {
    const cpf = requireScriptEnv('CERNE_ADMIN_CPF');
    const password = requireScriptEnv('CERNE_ADMIN_PASSWORD', { minLength: 12, secret: true });
    const email = requireScriptEnv('CERNE_ADMIN_EMAIL');
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    db.serialize(() => {
        db.get('SELECT id FROM profiles WHERE cpf = ?', [cpf], (err, row) => {
            if (row) {
                console.log('Admin user found. Resetting password and role...');
                db.run(
                    "UPDATE profiles SET password_hash = ?, role = 'admin', status_conta = 'ativo' WHERE id = ?",
                    [hashedPassword, row.id],
                    (err) => {
                        if (err) console.error('Error updating admin:', err);
                        else console.log('Admin credentials reset successfully.');
                    }
                );
            } else {
                console.log('Admin user not found. Creating new admin...');
                db.run(
                    `INSERT INTO profiles(id, nome_completo, cpf, email, password_hash, role, status_conta)
                     VALUES(?, 'Administrador', ?, ?, ?, 'admin', 'ativo')`,
                    [id, cpf, email, hashedPassword],
                    (err) => {
                        if (err) console.error('Error creating admin:', err);
                        else console.log('Admin user created successfully.');
                    }
                );
            }
        });
    });
};

fixAdmin();
