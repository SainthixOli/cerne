const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

const createSuperAdmin = async () => {
    const cpf = '999.999.999-99';
    const password = 'superadmin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    db.serialize(() => {
        db.get('SELECT id FROM profiles WHERE cpf = ?', [cpf], (err, row) => {
            if (row) {
                console.log('Super Admin already exists. Updating role/password...');
                db.run(
                    "UPDATE profiles SET role = 'super_admin', password_hash = ?, status_conta = 'ativo' WHERE id = ?",
                    [hashedPassword, row.id],
                    (err) => {
                        if (err) console.error(err);
                        else console.log('Super Admin updated.');
                    }
                );
            } else {
                console.log('Creating Super Admin...');
                db.run(
                    `INSERT INTO profiles(id, nome_completo, cpf, email, password_hash, role, status_conta)
                     VALUES(?, 'Super Admin Supremo', ?, 'super@sinpro.com', ?, 'super_admin', 'ativo')`,
                    [id, cpf, hashedPassword],
                    (err) => {
                        if (err) console.error(err);
                        else console.log('Super Admin created.');
                    }
                );
            }
        });
    });
};

createSuperAdmin();
