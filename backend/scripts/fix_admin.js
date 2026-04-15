const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

const fixAdmin = async () => {
    const cpf = '000.000.000-00';
    const password = 'admin123';
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
                     VALUES(?, 'Administrador Padrão', ?, 'admin@sinpro.com', ?, 'admin', 'ativo')`,
                    [id, cpf, hashedPassword],
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
