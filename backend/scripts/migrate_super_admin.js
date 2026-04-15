const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

const migrate = () => {
    db.serialize(() => {
        // 1. Rename old table
        db.run("ALTER TABLE profiles RENAME TO profiles_old");

        // 2. Create new table with updated CHECK constraint
        db.run(`
            CREATE TABLE profiles (
                id TEXT PRIMARY KEY,
                nome_completo TEXT NOT NULL,
                cpf TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                password_hash TEXT,
                change_password_required BOOLEAN DEFAULT 0,
                telefone TEXT,
                matricula_funcional TEXT,
                role TEXT CHECK (role IN ('admin', 'professor', 'super_admin')) NOT NULL DEFAULT 'professor',
                status_conta TEXT CHECK (status_conta IN ('pendente_docs', 'em_analise', 'ativo', 'inativo')) NOT NULL DEFAULT 'pendente_docs',
                reset_token TEXT,
                reset_token_expires DATETIME,
                photo_url TEXT
            )
        `);

        // 3. Copy data
        db.run(`
            INSERT INTO profiles (id, nome_completo, cpf, email, password_hash, change_password_required, telefone, matricula_funcional, role, status_conta, reset_token, reset_token_expires, photo_url)
            SELECT id, nome_completo, cpf, email, password_hash, change_password_required, telefone, matricula_funcional, role, status_conta, reset_token, reset_token_expires, photo_url
            FROM profiles_old
        `);

        // 4. Drop old table
        db.run("DROP TABLE profiles_old", (err) => {
            if (err) {
                console.error("Error dropping old table:", err);
            } else {
                console.log("Migration successful: 'super_admin' role added.");
            }
        });
    });
};

migrate();
