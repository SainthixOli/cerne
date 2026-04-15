const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

const createSystemManager = async () => {
    const cpf = '888.888.888-88';
    const password = 'sysadmin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    db.serialize(() => {
        db.get('SELECT id FROM profiles WHERE cpf = ?', [cpf], (err, row) => {
            if (row) {
                console.log('System Manager already exists. Updating...');
                db.run(
                    "UPDATE profiles SET role = 'system_manager', password_hash = ?, status_conta = 'ativo' WHERE id = ?",
                    [hashedPassword, row.id],
                    (err) => {
                        if (err) console.error(err);
                        else console.log('System Manager updated.');
                    }
                );
            } else {
                console.log('Creating System Manager...');
                db.run(
                    `INSERT INTO profiles(id, nome_completo, cpf, email, password_hash, role, status_conta)
                     VALUES(?, 'System Manager', ?, 'sys@sinpro.com', ?, 'system_manager', 'ativo')`,
                    [id, cpf, hashedPassword],
                    (err) => {
                        if (err) console.error(err);
                        else console.log('System Manager created.');
                    }
                );
            }
        });
    });
};

createSystemManager();
